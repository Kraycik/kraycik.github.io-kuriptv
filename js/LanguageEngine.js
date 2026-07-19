/**
 * KÜR IPTV - Tizen Language & Localization Engine (Klassik ES5)
 * Strings.xml faylının 100% rəsmi TV qarşılığı
 */
var Locale = {
    strings: {
        app_name: "KUR IPTV",
        active_period: "Aktivlik müddəti",
        active_period_message: "Başlanğıc: 365 gün",
        about_main_text: "KUR IPTV tətbiqi.\nTərtibatçı: Həmidov Ruzbek\nAzərbaycan, Şəmkir, KÜR qəsəbəsi ©2026",
        about_title: "Haqqımızda",
        about_version: "Versiya: 1.0.0",
        about_message: "Yüksək keyfiyyətli yayım platforması.",
        about_extra_text: "Bütün hüquqlar qorunur.",
        close: "Bağla",
        subscription_expired: "Abunəliyiniz dayandırılıb!",
        menu_about: "Haqqımızda",
        menu_channels: "Kanallar",
        menu_tutorial: "Video təlimat",
        menu_settings: "Ayarlar",
        loading_message: "Yüklənir...",
        no_channels: "Kanal tapılmadı",
        epg_no_info: "Proqram məlumatı yoxdur",
        epg_next: "Növbəti:"
    },

    /**
     * Android-dəki getString() funksiyasının sığortalanmış Tizen qarşılığı
     */
    get: function(key, formatValue) {
        var str = this.strings[key] || key;
        if (formatValue) {
            return str.replace("%1$s", formatValue);
        }
        return str;
    }
};
