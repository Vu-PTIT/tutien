extends RefCounted
class_name SocialTypography

const PROFILES: Dictionary = {
	&"header": {"desktop": &"UIHeading", "mobile": &"UIHeadingMobile"},
	&"body": {"desktop": &"UIBody", "mobile": &"UIBodyMobile"},
	&"caption": {"desktop": &"UISmall", "mobile": &"UISmallMobile"},
	&"chat_log": {"desktop": &"UIChatLog", "mobile": &"UIChatLogMobile"},
	&"chat_entry": {"desktop": &"UIChatEntry", "mobile": &"UIChatEntryMobile"},
	&"action": {"desktop": &"UIButton", "mobile": &"UIButtonMobile"},
}


static func apply_profile(control: Control, profile: StringName, mobile: bool) -> bool:
	var variants: Dictionary = PROFILES.get(profile, {})
	if variants.is_empty():
		push_warning("Unknown social typography profile: %s" % String(profile))
		return false
	control.theme_type_variation = variants["mobile" if mobile else "desktop"]
	return true
