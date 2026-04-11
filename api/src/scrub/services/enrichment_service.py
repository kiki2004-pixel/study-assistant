from __future__ import annotations

FREE_PROVIDERS = {
    "gmail.com",
    "yahoo.com",
    "yahoo.co.uk",
    "hotmail.com",
    "hotmail.co.uk",
    "outlook.com",
    "live.com",
    "msn.com",
    "icloud.com",
    "me.com",
    "mac.com",
    "protonmail.com",
    "proton.me",
    "aol.com",
    "mail.com",
    "ymail.com",
    "gmx.com",
    "gmx.net",
    "zoho.com",
    "fastmail.com",
    "hey.com",
}

DISPOSABLE_DOMAINS = {
    "mailinator.com",
    "guerrillamail.com",
    "guerrillamail.net",
    "guerrillamail.org",
    "tempmail.com",
    "temp-mail.org",
    "throwaway.email",
    "sharklasers.com",
    "guerrillamailblock.com",
    "grr.la",
    "guerrillamail.info",
    "spam4.me",
    "trashmail.com",
    "trashmail.me",
    "trashmail.net",
    "dispostable.com",
    "maildrop.cc",
    "yopmail.com",
    "fakeinbox.com",
    "mailnull.com",
    "spamgourmet.com",
    "trashmail.at",
    "discard.email",
    "spamoff.de",
    "wegwerfmail.de",
    "wegwerfmail.net",
    "wegwerfmail.org",
}

GENERIC_USERNAMES = {
    "info",
    "admin",
    "administrator",
    "support",
    "help",
    "contact",
    "sales",
    "marketing",
    "noreply",
    "no-reply",
    "postmaster",
    "webmaster",
    "abuse",
    "billing",
    "hello",
    "team",
    "hr",
    "ops",
    "dev",
    "test",
    "mail",
    "email",
    "office",
    "inquiry",
    "enquiry",
    "service",
    "services",
    "newsletter",
    "feedback",
    "careers",
    "jobs",
    "press",
    "media",
    "legal",
    "privacy",
    "security",
    "it",
    "tech",
    "reception",
    "accounts",
    "finance",
}

MX_PROVIDER_MAP = {
    "google": "Google Workspace",
    "googlemail": "Google Workspace",
    "gmail": "Gmail",
    "aspmx": "Google Workspace",
    "outlook": "Microsoft 365",
    "protection.outlook": "Microsoft 365",
    "hotmail": "Microsoft 365",
    "live": "Microsoft 365",
    "yahoodns": "Yahoo Mail",
    "yahoo": "Yahoo Mail",
    "protonmail": "Proton Mail",
    "mailgun": "Mailgun",
    "sendgrid": "SendGrid",
    "amazonses": "Amazon SES",
    "mxroute": "MXroute",
    "fastmail": "Fastmail",
    "zoho": "Zoho Mail",
    "icloud": "Apple iCloud",
}


def detect_provider(mx_host: str | None) -> str | None:
    if not mx_host:
        return None
    host_lower = mx_host.lower()
    for key, name in MX_PROVIDER_MAP.items():
        if key in host_lower:
            return name
    return None


def compute_quality_score(
    *,
    valid_format: bool,
    valid_domain: bool,
    can_receive_email: bool,
    is_disposable: bool,
    is_generic: bool,
) -> int:
    score = 0
    if valid_format:
        score += 20
    if valid_domain:
        score += 20
    if can_receive_email:
        score += 30
    if not is_disposable:
        score += 15
    if not is_generic:
        score += 15
    return score


def enrich(email: str, mx_host: str | None) -> dict:
    parts = email.strip().split("@")
    username = parts[0] if len(parts) == 2 else ""
    domain = parts[1].lower() if len(parts) == 2 else ""

    return {
        "username": username,
        "domain": domain,
        "is_free": domain in FREE_PROVIDERS,
        "is_disposable": domain in DISPOSABLE_DOMAINS,
        "is_generic": username.lower() in GENERIC_USERNAMES,
        "provider": detect_provider(mx_host),
        "mx_record": mx_host,
    }
