extends RefCounted
class_name SocialTypography

const PROFILES: Dictionary = {
	&"header": {"desktop": &"SocialHeader", "mobile": &"SocialHeaderMobile"},
	&"body": {"desktop": &"SocialBody", "mobile": &"SocialBodyMobile"},
	&"caption": {"desktop": &"SocialCaption", "mobile": &"SocialCaptionMobile"},
	&"chat_log": {"desktop": &"SocialChatLog", "mobile": &"SocialChatLogMobile"},
	&"chat_entry": {"desktop": &"SocialChatEntry", "mobile": &"SocialChatEntryMobile"},
	&"action": {"desktop": &"SocialAction", "mobile": &"SocialActionMobile"},
}


static func apply_profile(control: Control, profile: StringName, mobile: bool) -> bool:
	var variants: Dictionary = PROFILES.get(profile, {})
	if variants.is_empty():
		push_warning("Unknown social typography profile: %s" % String(profile))
		return false
	control.theme_type_variation = variants["mobile" if mobile else "desktop"]
	return true
