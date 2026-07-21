export type Mode = 'sign-in' | 'sign-up';

export type AuthPanelVariant = 'inline' | 'screen';

/** Screen auth: phone form vs wide split (form + card art). */
export type AuthScreenLayout = 'mobile' | 'wide';

/** Immersive = mobile vault layout; classic = settings inline card. */
export type AuthPresentation = 'classic' | 'immersive';
