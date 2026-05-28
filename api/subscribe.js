const KIT_API_BASE = "https://api.kit.com/v4";

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function cleanString(value, max = 5000) {
  if (value == null) return "";
  return String(value).trim().slice(0, max);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function buildFields(payload) {
  const scorecard = payload.scorecard || {};
  const dimensionSummary = Object.values(scorecard)
    .map((d) => `${d.name}: ${d.score}/${d.max}`)
    .join(" | ");

  return {
    iconic_result_category: cleanString(payload.category, 255),
    iconic_total_score: cleanString(`${payload.total_score}/${payload.total_max}`, 50),
    iconic_first_gap: cleanString(payload.first_gap, 255),
    iconic_first_move: cleanString(payload.first_move, 1000),
    iconic_dimension_scores: cleanString(dimensionSummary, 1000),
    iconic_workbook_markdown: cleanString(payload.workbook_markdown, 12000),
  };
}

async function kitFetch(path, options = {}) {
  const apiKey = process.env.KIT_API_KEY || process.env.CONVERTKIT_API_KEY;
  if (!apiKey) {
    const error = new Error("Missing KIT_API_KEY environment variable.");
    error.status = 500;
    throw error;
  }

  const response = await fetch(`${KIT_API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Kit-Api-Key": apiKey,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const error = new Error(data?.errors?.join(", ") || data?.message || "Kit API request failed.");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function createOrUpdateSubscriber(payload, includeFields = true) {
  const body = {
    first_name: cleanString(payload.name, 255),
    email_address: cleanString(payload.email, 255),
  };

  if (includeFields) {
    body.fields = buildFields(payload);
  }

  return kitFetch("/subscribers", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function addSubscriberToForm(subscriberId, referrer) {
  const formId = process.env.KIT_FORM_ID || process.env.CONVERTKIT_FORM_ID;
  if (!formId) {
    const error = new Error("Missing KIT_FORM_ID environment variable.");
    error.status = 500;
    throw error;
  }

  return kitFetch(`/forms/${formId}/subscribers/${subscriberId}`, {
    method: "POST",
    body: JSON.stringify({
      referrer: cleanString(referrer || "https://fscreative.live/", 2000),
    }),
  });
}

async function addSubscriberToTag(subscriberId) {
  const tagId = process.env.KIT_TAG_ID || process.env.CONVERTKIT_TAG_ID;
  if (!tagId) return null;

  return kitFetch(`/tags/${tagId}/subscribers/${subscriberId}`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { ok: false, error: "Method not allowed." });
  }

  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    const name = cleanString(payload.name, 255);
    const email = cleanString(payload.email, 255).toLowerCase();

    if (!name || !isEmail(email)) {
      return json(res, 400, { ok: false, error: "Name and valid email are required." });
    }

    const safePayload = {
      ...payload,
      name,
      email,
      total_score: Number(payload.total_score || 0),
      total_max: Number(payload.total_max || 45),
      referrer: payload.referrer || req.headers.referer || "https://fscreative.live/",
    };

    let subscriberResult;
    let customFieldsSaved = true;

    try {
      subscriberResult = await createOrUpdateSubscriber(safePayload, true);
    } catch (error) {
      // If custom fields have not been created in Kit yet, save the subscriber anyway.
      if (error.status === 422) {
        customFieldsSaved = false;
        subscriberResult = await createOrUpdateSubscriber(safePayload, false);
      } else {
        throw error;
      }
    }

    const subscriber = subscriberResult.subscriber;
    if (!subscriber?.id) {
      throw new Error("Kit did not return a subscriber ID.");
    }

    const formResult = await addSubscriberToForm(subscriber.id, safePayload.referrer);
    let tagResult = null;
    try {
      tagResult = await addSubscriberToTag(subscriber.id);
    } catch (error) {
      // Tagging is useful, but should not block workbook delivery.
      tagResult = { warning: error.message };
    }

    return json(res, 200, {
      ok: true,
      subscriber_id: subscriber.id,
      email: subscriber.email_address || email,
      form_state: formResult?.subscriber?.state || subscriber.state || null,
      custom_fields_saved: customFieldsSaved,
      tag_result: tagResult ? "attempted" : "not_configured",
    });
  } catch (error) {
    return json(res, error.status || 500, {
      ok: false,
      error: error.message || "Something went wrong.",
      details: error.data || null,
    });
  }
};
