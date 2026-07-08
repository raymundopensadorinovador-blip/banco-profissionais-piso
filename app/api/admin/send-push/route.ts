import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type SendPushBody = {
  title?: string;
  message?: string;
  targetUrl?: string;
  imageUrl?: string;
  targetProfessionalIds?: string[];
  filters?: Record<string, unknown>;
};

type ProfessionalTarget = {
  id: string;
  full_name: string;
  onesignal_external_id: string | null;
  onesignal_subscription_id: string | null;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }

  return value;
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
    const supabaseAnonKey = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

    const oneSignalAppId =
      process.env.ONESIGNAL_APP_ID ?? process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

    if (!oneSignalAppId) {
      throw new Error("Variável de ambiente ausente: ONESIGNAL_APP_ID.");
    }

    const oneSignalRestApiKey = getRequiredEnv("ONESIGNAL_REST_API_KEY");

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: userData, error: userError } =
      await userSupabase.auth.getUser();

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const { error: adminError } = await userSupabase.rpc(
      "get_professionals_admin_summary"
    );

    if (adminError) {
      return NextResponse.json(
        { error: "Acesso administrativo negado." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as SendPushBody;

    const title = cleanString(body.title);
    const message = cleanString(body.message);
    const targetUrl = cleanString(body.targetUrl);
    const imageUrl = cleanString(body.imageUrl);
    const filters = body.filters ?? {};

    const targetProfessionalIds = uniqueValues(
      Array.isArray(body.targetProfessionalIds)
        ? body.targetProfessionalIds.filter(
            (item): item is string => typeof item === "string"
          )
        : []
    );

    if (!title) {
      return NextResponse.json(
        { error: "Título da notificação é obrigatório." },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Mensagem da notificação é obrigatória." },
        { status: 400 }
      );
    }

    if (targetProfessionalIds.length === 0) {
      return NextResponse.json(
        { error: "Selecione pelo menos um profissional." },
        { status: 400 }
      );
    }

    if (targetProfessionalIds.length > 20000) {
      return NextResponse.json(
        { error: "O limite por envio é de 20.000 destinatários." },
        { status: 400 }
      );
    }

    const serviceSupabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data: targets, error: targetsError } = await serviceSupabase
      .from("professionals")
      .select(
        "id, full_name, onesignal_external_id, onesignal_subscription_id"
      )
      .in("id", targetProfessionalIds)
      .eq("push_enabled", true)
      .not("onesignal_external_id", "is", null);

    if (targetsError) {
      throw targetsError;
    }

    const professionals = (targets ?? []) as ProfessionalTarget[];

    const externalIds = uniqueValues(
      professionals
        .map((professional) => professional.onesignal_external_id ?? "")
        .filter(Boolean)
    );

    if (externalIds.length === 0) {
      return NextResponse.json(
        {
          error:
            "Nenhum profissional selecionado possui notificação push ativa.",
        },
        { status: 400 }
      );
    }

    const appOrigin = request.nextUrl.origin;

    const oneSignalPayload: Record<string, unknown> = {
      app_id: oneSignalAppId,
      target_channel: "push",
      include_aliases: {
        external_id: externalIds,
      },
      headings: {
        en: title,
        pt: title,
      },
      contents: {
        en: message,
        pt: message,
      },
      name: `BP Piso - ${title.slice(0, 80)}`,
      chrome_web_icon: `${appOrigin}/icons/icon-192.png`,
      firefox_icon: `${appOrigin}/icons/icon-192.png`,
      data: {
        source: "banco_profissionais_piso",
      },
    };

    if (targetUrl) {
      oneSignalPayload.url = targetUrl;
      oneSignalPayload.web_url = targetUrl;
    }

    if (imageUrl) {
      oneSignalPayload.chrome_web_image = imageUrl;
      oneSignalPayload.big_picture = imageUrl;
    }

    const oneSignalResponse = await fetch(
      "https://api.onesignal.com/notifications?c=push",
      {
        method: "POST",
        headers: {
          Authorization: `Key ${oneSignalRestApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(oneSignalPayload),
      }
    );

    const oneSignalResponseData = await oneSignalResponse.json();

    const campaignStatus = oneSignalResponse.ok ? "sent" : "failed";
    const oneSignalNotificationId =
      typeof oneSignalResponseData.id === "string"
        ? oneSignalResponseData.id
        : null;

    const { data: campaign, error: campaignError } = await serviceSupabase
      .from("professional_push_campaigns")
      .insert({
        title,
        message,
        target_url: targetUrl || null,
        image_url: imageUrl || null,
        filters,
        recipients_count: externalIds.length,
        onesignal_notification_id: oneSignalNotificationId,
        onesignal_response: oneSignalResponseData,
        status: campaignStatus,
        error_message: oneSignalResponse.ok
          ? null
          : JSON.stringify(oneSignalResponseData),
        created_by: userData.user.id,
      })
      .select("id")
      .single();

    if (campaignError) {
      throw campaignError;
    }

    if (campaign?.id) {
      const recipientRows = professionals.map((professional) => ({
        campaign_id: campaign.id,
        professional_id: professional.id,
        onesignal_external_id: professional.onesignal_external_id,
        onesignal_subscription_id: professional.onesignal_subscription_id,
        status: oneSignalResponse.ok ? "sent" : "failed",
      }));

      if (recipientRows.length > 0) {
        await serviceSupabase
          .from("professional_push_campaign_recipients")
          .insert(recipientRows);
      }
    }

    if (!oneSignalResponse.ok) {
      return NextResponse.json(
        {
          error: "OneSignal recusou o envio.",
          details: oneSignalResponseData,
          campaignId: campaign?.id ?? null,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      campaignId: campaign?.id ?? null,
      onesignalNotificationId: oneSignalNotificationId,
      recipientsCount: externalIds.length,
      response: oneSignalResponseData,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível enviar a notificação.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}