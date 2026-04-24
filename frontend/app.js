const tg = window.Telegram.WebApp;

async function init() {
    const res = await fetch("/profile/init", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ initData: tg.initData })
    });

    const { user_id } = await res.json();

    navigator.geolocation.getCurrentPosition(async (pos) => {
        await fetch("/profile/update", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({
                user_id,
                age: 22,
                bio: "hi",
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude
            })
        });
    });
}

init();