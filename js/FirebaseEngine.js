/**
 * KÜR IPTV - Tizen Firebase & Security Engine (Klassik ES5 Model)
 * Android LoginActivity-dəki XOR minalarının və Cihaz Kilidləmə sisteminin 100% rəsmi TV qarşılığı
 */
var FirebaseEngine = {
    DB_URL: "https://kuiptv-ce646-default-rtdb.europe-west1.firebasedatabase.app",
    API_KEY: "AIzaSyCJgtY_Mg_mTIz9HzZm7yPZBPiHDh4TI3c",


    /**
     * Smart TV-nin unikal DUID (Device ID) kodunu təhlükəsiz çəkən funksiya
     * Simulyator mühitində avtomatik virtual ID generasiya edir (Crash sığortası)
     */
    getDeviceUID: function() {
        try {
            if (window.webapis && window.webapis.product && typeof window.webapis.product.getDUID === "function") {
                return window.webapis.product.getDUID();
            }
        } catch (e) {
            console.log("Simulyator rejimi üçün virtual ID hazırlanır.");
        }
        
        // Simulyator brauzeri üçün yaddaşda sabit qalan virtual unikal ID sığortası
        var virtualID = localStorage.getItem("virtual_tv_duid");
        if (!virtualID) {
            virtualID = "KUR_IPTV_" + Math.random().toString(36).substring(2, 10).toUpperCase();
            localStorage.setItem("virtual_tv_duid", virtualID);
        }
        return virtualID;
    },

    /**
     * 🔐 [GİRİŞ VƏ CİHAZ YOXALNIŞI MÜHƏRRİKİ]
     * Android LoginActivity-dəki bütün uğurlu qoşulma və cihaz bağlama alqoritmi
     */
    checkUserStatus: function(userCode) {
        console.log("KÜR IPTV: Təhlükəsizlik mühərriki işə düşdü. Kod: " + userCode);
        var self = this;
        var currentTvID = this.getDeviceUID();

        return fetch(this.DB_URL + "/" + userCode + ".json?auth=" + this.API_KEY)
            .then(function(response) {
                if (!response.ok) return null;
                return response.json();
            })
            .then(function(userData) {
                if (!userData) {
                    alert("Səhv ID və ya abunəlik tapılmadı!");
                    self.handleLogout();
                    return null;
                }

                var role = userData.role || "user";
                var isAdmin = role.toLowerCase() === "admin";

                // --- STATUS VƏ TARİX YOXLANMASI ---
                if (!isAdmin) {
                    var status = userData.status || "active";
                    var expireDate = userData.expire_date || "";
                    var today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

                    if (status === "blocked") {
                        alert("Xəta: Abunəliyiniz dondurulub!");
                        self.handleLogout();
                        return null;
                    }

                    if (expireDate !== "" && expireDate < today) {
                        alert("Xəta: Abunəlik vaxtınız bitib!");
                        self.handleLogout();
                        return null;
                    }
                }

                // --- 🛡️ CİHAZ YOXALNIŞI SİĞORTASI (Android Məntiqi) ---
                if (!isAdmin) {
                    var savedDeviceId = userData.deviceId || userData.deviceid || "";

                    if (savedDeviceId === "") {
                        // İlk giriş: Bu televizorun ID-sini Firebase-ə rəsmən bağlayırıq
                        self.bindDeviceToFirebase(userCode, currentTvID);
                    } else if (savedDeviceId !== currentTvID) {
                        // Başqa cihaz: Giriş tamamilə qadağandır!
                        alert("XƏTA: Bu ID artıq başqa cihazda aktivdir!");
                        self.handleLogout();
                        return null;
                    }
                }

                // Giriş məlumatlarını Tizen localstorage-ə yazırıq
                localStorage.setItem("is_logged_in", "true");
                localStorage.setItem("user_code", userCode);
                localStorage.setItem("is_admin", isAdmin ? "true" : "false");

                console.log("✅ Giriş uğurludur! Cihaz ID: " + currentTvID);

                // 🚀 KRİTİK DÜZƏLİŞ: Kanal yükləmə motorunu asinxron olaraq tetikləyirik
                setTimeout(function() {
                    if (window.loadMediaData && typeof window.loadMediaData === "function") {
                        console.log("🔄 FirebaseEngine: Qlobal loadMediaData çağırılır...");
                        window.loadMediaData(userData);
                    } else if (window.AppCore && typeof window.AppCore.loadMediaData === "function") {
                        console.log("🔄 FirebaseEngine: AppCore.loadMediaData çağırılır...");
                        window.AppCore.loadMediaData(userData);
                    } else if (window.ChannelRepository && typeof window.ChannelRepository.fetchFromM3u === "function") {
                        // Əgər heç bir körpü tapılmazsa, birbaşa Repository-ni sığortalayırıq
                        var backupUrl = userData.m3u_url || userData.url || userData.playlist || userData.playlist_url || "";
                        console.log("🔄 Sığorta rejimi: Birbaşa ChannelRepository funksiyası işə düşür. Link: " + backupUrl);
                        
                        window.ChannelRepository.fetchFromM3u(backupUrl, function(success) {
                            if (success && window.ChannelAdapter && typeof window.ChannelAdapter.updateData === "function") {
                                window.ChannelAdapter.updateData(window.ChannelRepository.getChannels());
                                if (window.AppCore) window.AppCore.currentFocusArea = "channels";
                            }
                        });
                    } else {
                        console.error("🚨 KRİTİK XƏTA: Layihədə kanalları qəbul edəcək heç bir funksiya tapılmadı!");
                    }
                }, 100);

                return userData;
            }, function(error) {
                console.error("Şəbəkə qoşulma xətası: ", error);
                alert("Bağlantı xətası!");
                return null;
            });
    },


    /**
     * İlk dəfə daxil olan TV-nin unikal kodunu Firebase bazasına PUT metodu ilə yazır
     */
    bindDeviceToFirebase: function(userCode, tvID) {
        fetch(this.DB_URL + "/" + userCode + "/deviceId.json?auth=" + this.API_KEY, {
            method: "PUT",
            body: JSON.stringify(tvID)
        })
        .then(function() {
            console.log("🛡️ Cihaz uğurla bu ID koduna bağlandı: " + tvID);
        })
        .catch(function(e) {
            console.error("Cihaz bağlanarkən xəta: ", e);
        });
    },

    checkAdminMessage: function(userCode, callback) {
        fetch(this.DB_URL + "/" + userCode + "/message.json?auth=" + this.API_KEY)
            .then(function(response) { return response.json(); })
            .then(function(message) {
                if (message && message.trim() !== "") {
                    callback(message);
                }
            }, function() {});
    },

    clearAdminMessage: function(userCode) {
        fetch(this.DB_URL + "/" + userCode + "/message.json?auth=" + this.API_KEY, {
            method: "PUT",
            body: JSON.stringify("")
        });
    },

    handleLogout: function() {
        localStorage.removeItem("is_logged_in");
        localStorage.removeItem("user_code");
        localStorage.removeItem("is_admin");
        
        // Əgər tətbiq açıqdırsa, Giriş ekranını yenidən aktiv edirik
        if (window.AppCore && typeof AppCore.openLoginScreen === "function") {
            AppCore.openLoginScreen();
        }
    }
};
