export const STUDIO_BAR_STORAGE_KEY = "remocn-studio-bar";

export const STUDIO_BAR_SCRIPT = `try{if(localStorage.getItem("${STUDIO_BAR_STORAGE_KEY}")==="dismissed")document.documentElement.dataset.studioBar="dismissed"}catch(e){}`;
