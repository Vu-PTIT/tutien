// Painted-object pictograms stay vector sharp at every display scale.
const objects = {
 book: '<path d="M3 5.5c3-1.5 6-1.3 9 .7v14c-3-2-6-2-9-.6z" fill="#b7cadb"/><path d="M12 6.2c3-2 6-2.2 9-.7v14c-3-1.4-6-1.4-9 .6z" fill="#fff4d9"/><path d="M12 7v12M6 9h3M6 12h3M15 9h3M15 12h3"/><path d="M16 5.5v6l1.5-1 1.5 1V5" fill="#ca9d59" stroke="none"/><path d="M2.5 21h19" stroke="#ba955d"/>',
 run: '<path d="m6 4 4 2 1 6 3 2 7 2v4H3v-5l3-4z" fill="#93b8ab"/><path d="m6 4 4 2-1 5-3-1z" fill="#faf1db"/><path d="M3 17h18v3H3z" fill="#fff4da"/><path d="m10 12 3-1m0 3 3-1m0 2 2-1M3 22h18"/><path d="m16 4 4-1m-5 4h5" stroke="#c7a565"/>',
 bowl: '<path d="M3 12h18c-.5 5-3.5 8-9 8s-8.5-3-9-8z" fill="#efc8a0"/><ellipse cx="12" cy="12" rx="9" ry="2.8" fill="#fff4d9"/><path d="m7 11 2-2 2 3 3-4 3 3" stroke="#94aa75"/><path d="M8 4c-2 2 2 2 0 4m5-6c-2 2 2 2 0 4m5-2-4 7" stroke="#b89765"/><path d="M8 21h8"/>',
 school: '<path d="M4 9h16v12H4z" fill="#faf0d7"/><path d="m2 9 10-6 10 6z" fill="#94b4c5"/><path d="M9 21v-6h6v6" fill="#b9c9d5"/><path d="M7 11v2m10-2v2m-5-6v3"/><circle cx="12" cy="8.5" r="1.5" fill="#efd29a"/>',
 briefcase: '<rect x="3" y="7" width="18" height="13" rx="2" fill="#a5bacd"/><path d="M3 12c6 2 12 2 18 0v-3a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" fill="#f3d4a0"/><path d="M8 7V4h8v3"/><rect x="10" y="11" width="4" height="4" rx="1" fill="#c19b60"/><path d="M6 17h3" stroke="#f9f0d8"/>',
 moon: '<path d="M17.5 3.5A8.5 8.5 0 1 0 21 16c-8 2-12-4-9-12.5z" fill="#efd09a"/><path d="m18 4 .8 2.1L21 7l-2.2.8L18 10l-.8-2.2L15 7l2.2-.9z" fill="#a9b6d2" stroke="#798ba8"/><path d="m7 17 2 1" stroke="#c59a5e"/>',
 drop: '<path d="M12 2C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-13z" fill="#a7cbd4"/><path d="M8 14c-.5 3 1 4.5 3 4.5" stroke="#fffaf0" stroke-width="2"/><path d="m12 5 3 5" stroke="#779eaa"/>',
 spark: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z" fill="#dac5dd" stroke="#97849c"/><path d="m12 6 1.5 5 4.5 1" stroke="#fffaf0"/><circle cx="20" cy="4" r="1" fill="#d1ad6e" stroke="none"/>',
 lotus: '<path d="M12 20c-5-5-4-10 0-16 4 6 5 11 0 16z" fill="#d6b8c5"/><path d="M12 20C5 20 2 16 3 10c6 1 9 5 9 10z" fill="#b7cab6"/><path d="M12 20c7 0 10-4 9-10-6 1-9 5-9 10z" fill="#9ab9a4"/><path d="M5 22h14m-7-4V9" stroke="#698a7b"/>',
 bed: '<path d="M3 9h18v11H3z" fill="#c7c4dc"/><path d="M5 9V5h14v4" fill="#e7d8c4"/><path d="M3 14h18M3 20v2m18-2v2"/><path d="M6 10h5v4H6z" fill="#fff5e2"/><path d="m15 3 2-1-2-1" stroke="#ae976a"/>',
 footprints: '<ellipse cx="8" cy="8" rx="3" ry="5" fill="#a9c6b4" transform="rotate(-20 8 8)"/><ellipse cx="16" cy="16" rx="3" ry="5" fill="#eed4a2" transform="rotate(15 16 16)"/>',
 gamepad: '<path d="M8 7h8c3 0 5 2 5 6v3a3 3 0 0 1-5 2l-2-2h-4l-2 2a3 3 0 0 1-5-2v-3c0-4 2-6 5-6z" fill="#e6cba7"/><path d="M6 12h5m-2.5-2.5v5"/><circle cx="16" cy="11" r="1" fill="#92b4aa"/><circle cx="18" cy="14" r="1" fill="#a99dc0"/>',
};

export function activityArtwork(name, size = 32) {
 if (!objects[name]) return '';
 return `<svg class="icon activity-picto" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#425666" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${objects[name]}</svg>`;
}

export function lunarSeal(phase) {
 const ticks = Array.from({length:24},(_,i)=>`<path d="M60 8v${i%3===0?5:2.5}" transform="rotate(${i*15} 60 60)"/>`).join('');
 return `<span class="lunar-seal" aria-hidden="true"><svg class="lunar-seal-ring" viewBox="0 0 120 120" fill="none" stroke="#bc975c"><circle cx="60" cy="60" r="57" stroke-width=".8"/><circle cx="60" cy="60" r="47" stroke-width=".6"/><circle cx="60" cy="60" r="43" stroke-width=".5" stroke-dasharray="1 4"/>${ticks}</svg><span class="lunar-seal-phase">${phase}</span></span>`;
}

export function moodArtwork(mood) {
 const faces={joy:'<path d="M7 9h.1m9.9 0h.1M7 14c3 4 7 4 10 0"/>',calm:'<path d="m6 10 2-1 2 1m4 0 2-1 2 1M9 15h6"/>',focus:'<path d="m6 8 4 2m8-2-4 2M8 12h.1m7.9 0h.1M10 16h4"/>',drive:'<path d="m7 8 1 2 2 .5-2 1-1 2-.5-2-2-1 2-.5zM16 9h.1M8 16c2 2 6 2 8-1"/>',tired:'<path d="M6 10h4m4 0h4"/><ellipse cx="12" cy="16" rx="2" ry="2.5"/>'};
 return `<svg class="mood-artwork" viewBox="0 0 24 24" fill="none" stroke="#7a6a52" stroke-width="1.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#f8e6bc"/>${faces[mood]||faces.calm}</svg>`;
}
