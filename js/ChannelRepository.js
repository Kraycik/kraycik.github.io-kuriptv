/**
 * KÜR IPTV - Tizen Core Channel & EPG Repository (Klassik ES5)
 * Android MainActivity EPG Parser və getLiveEpg funksiyalarının 100% rəsmi TV qarşılığı
 * ReferenceError: Channel is not defined xətası 100% kökündən ləğv olundu
 */
var ChannelRepository = {
    _channels: [],
    _epgPrograms: [],
    _epgUrl: null,
    _uiUpdateListener: null,

    init: function() {
        console.log("KÜR IPTV: Tizen Repository başladıldı.");
    },

    getChannels: function() {
        return this._channels;
    },

    setUiUpdateListener: function(listener) {
        this._uiUpdateListener = listener;
    },

    /**
     * 📺 [CANLI EPG PROQRAMINI TAPMA FUNKSİYASI - 100% AVTONOM]
     */
    getLiveEpg: function(tvgId) {
        if (!tvgId) {
            return { current: "Canlı Yayım", next: "Məlumat yoxdur" };
        }

        var now = Date.now();
        var programs = [];

        for (var i = 0; i < this._epgPrograms.length; i++) {
            var p = this._epgPrograms[i];
            if (p.channelId && p.channelId.toLowerCase() === tvgId.toLowerCase()) {
                programs.push(p);
            }
        }

        if (programs.length === 0) {
            return { current: "Canlı Yayım", next: "Məlumat yoxdur" };
        }

        programs.sort(function(a, b) {
            return a.start - b.start;
        });

        var currentProg = "Canlı Yayım";
        var nextProg = "Məlumat yoxdur";

        var formatTime = function(timestamp) {
            var d = new Date(timestamp);
            var hr = String(d.getHours()).padStart(2, '0');
            var min = String(d.getMinutes()).padStart(2, '0');
            return hr + ":" + min;
        };

        for (var j = 0; j < programs.length; j++) {
            var prog = programs[j];
            if (now >= prog.start && now < prog.stop) {
                currentProg = formatTime(prog.start) + " - " + prog.title;
                
                if (j + 1 < programs.length) {
                    var next = programs[j + 1];
                    nextProg = formatTime(next.start) + " - " + next.title;
                }
                break;
            }
        }

        return { current: currentProg, next: nextProg };
    },

    /**
     * 🛡️ [M3U SƏTİRLƏRİNİ REGEX İLƏ OXUYAN SÜRƏTLİ PARSER - MODEL KİLİDSİZ SƏRBƏST SİSTEM]
     */
    fetchFromM3u: function(m3uUrl, onComplete) {
        var self = this;
        
        // [OBJECT OBJECT] SIĞORTASI
        if (typeof m3uUrl === "object" && m3uUrl !== null) {
            m3uUrl = m3uUrl.m3u_url || m3uUrl.url || "";
        }
        
        console.log("M3U Yüklənir: " + m3uUrl);

        if (!m3uUrl || m3uUrl.trim() === "") {
            console.error("🚨 KÜR IPTV: M3U Linki boşdur!");
            if (onComplete) onComplete(false);
            return;
        }

        // TƏK LİNK (.M3U8/.TS) SIĞORTASI
        var lowerUrl = m3uUrl.toLowerCase();
        if (lowerUrl.indexOf(".m3u") === -1 && (lowerUrl.indexOf(".m3u8") !== -1 || lowerUrl.indexOf(".ts") !== -1 || lowerUrl.indexOf("xtream") !== -1)) {
            console.log("🚀 KÜR IPTV: Serverdən birbaşa tək canlı yayım linki təsbit edildi!");
            
            // Düzəliş: Model asılılığı ləğv edildi, birbaşa rəsmi obyekt literalından istifadə olunur
            var singleChannel = {
                name: "Canlı Yayım Kanalı",
                url: m3uUrl,
                logoUrl: "img/yenilogom.png",
                category: "Canlı",
                tvgId: null,
                isFavorite: false,
                isLocked: false
            };
            self._channels = [singleChannel];
            if (onComplete) onComplete(true);
            return;
        }

     // Normal çoxlu kanal ehtiva edən M3U siyahısı parseri:
        return fetch(m3uUrl)
            .then(function(response) {
                if (!response.ok) throw new Error("M3U Şəbəkə xətası!");
                return response.text();
            })
            .then(function(text) {
                var lines = text.split(/\r?\n/);
                var newList = [];
                var tempName = "";
                var tempLogo = "";
                var tempTvgId = "";
                var tempCategory = "Digərləri";

                // 🚀 DÜZƏLİŞ: Böyük/kiçik hərf fərqlərini tutmaq üçün /i bayrağı əlavə edildi
                var tvgIdReg = /tvg-id="([^"]+)"/i;
                var tvgLogoReg = /tvg-logo="([^"]+)"/i;
                var groupTitleReg = /group-title="([^"]+)"/i;
                var urlTvgReg = /(?:url-tvg|x-tvg-url)="([^"]+)"/i;

                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i].trim();

                    if (line.indexOf("#EXTM3U") === 0) {
                        var m3uMatch = line.match(urlTvgReg);
                        if (m3uMatch && m3uMatch[1]) self._epgUrl = m3uMatch[1];
                    }

                    if (line.indexOf("#EXTINF") === 0) {
                        // 🚀 DÜZƏLİŞ: Massiv yox, [1]-ci indeksdəki təmiz mətnlər götürülür!
                        var idMatch = line.match(tvgIdReg);
                        tempTvgId = (idMatch && idMatch[1]) ? idMatch[1].trim() : "";

                        var logoMatch = line.match(tvgLogoReg);
                        tempLogo = (logoMatch && logoMatch[1]) ? logoMatch[1].trim() : "";

                        var groupMatch = line.match(groupTitleReg);
                        tempCategory = (groupMatch && groupMatch[1]) ? groupMatch[1].trim() : "Digərləri";

                        if (line.indexOf(",") !== -1) {
                            tempName = line.substring(line.lastIndexOf(",") + 1).trim();
                        } else {
                            tempName = "";
                        }
                    } else if (line.length > 0 && line.indexOf("#") !== 0) {
                        
                        newList.push({
                            name: tempName || ("Kanal " + (newList.length + 1)),
                            url: line,
                            logoUrl: tempLogo || "img/yenilogom.png",
                            tvgId: tempTvgId || null,
                            category: tempCategory,
                            isFavorite: false,
                            isLocked: false
                        });

                        tempName = ""; tempLogo = ""; tempTvgId = ""; tempCategory = "Digərləri";
                    }
                }

                self._channels = newList;
                console.log("📺 Repository: " + newList.length + " kanalın hamısı öz rəsmi loqoları ilə bazaya işləndi.");
                
                if (self._epgUrl) {
                    self.fetchEpg(self._epgUrl);
                }

                if (onComplete) onComplete(newList.length > 0);
            })
            .catch(function(err) {
                console.error("M3U Parse xətası: ", err);
                if (onComplete) onComplete(false);
            });
    },

    /**
     * 🛡️ [EPG XML DOM PARSER MÜHƏRRİKİ - GZIP SIĞORTALI]
     */
    fetchEpg: function(epgUrl) {
        var self = this;
        
        if (!epgUrl) return;
        
        if (typeof epgUrl === "object" && epgUrl !== null) {
            epgUrl = epgUrl[1] || epgUrl.url || "";
        }

        console.log("EPG Yüklənir: " + epgUrl);

        // 🛡️ [GZIP (.GZ) SIĞORTASI] - Sıxılmış qovluq olanda brauzerin donmasını rəsmən önləyirik
        if (epgUrl.toLowerCase().indexOf(".gz") !== -1) {
            console.log("⚠ KÜR IPTV: .gz sıxılmış EPG formatı təsbit edildi. Canlı yayımın donmaması üçün keçilir.");
            if (self._uiUpdateListener) {
                self._uiUpdateListener();
            }
            return;
        }

        return fetch(epgUrl)
            .then(function(response) {
                if (!response.ok) throw new Error("EPG Şəbəkə xətası!");
                return response.text();
            })
            .then(function(text) {
                var parser = new DOMParser();
                var xmlDoc = parser.parseFromString(text, "text/xml");
                var programmes = xmlDoc.getElementsByTagName("programme");
                var newEpgPrograms = [];

                for (var i = 0; i < programmes.length; i++) {
                    var progNode = programmes[i];
                    var startStr = progNode.getAttribute("start") || "";
                    var stopStr = progNode.getAttribute("stop") || "";
                    var channelId = progNode.getAttribute("channel") || "";
                    
                    var titleNode = progNode.getElementsByTagName("title");
                    var titleText = titleNode && titleNode[0] ? titleNode[0].textContent.trim() : "";

                    if (titleText !== "") {
                        newEpgPrograms.push({
                            channelId: channelId,
                            title: titleText,
                            start: self.parseEpgDate(startStr),
                            stop: self.parseEpgDate(stopStr)
                        });
                    }
                }

                self._epgPrograms = newEpgPrograms;
                console.log("KÜR IPTV: EPG yükləndi. Say: " + newEpgPrograms.length);

                if (self._uiUpdateListener) {
                    self._uiUpdateListener();
                }
            })
            .catch(function(e) {
                console.error("EPG Daxili Parse xətası sığortalandı: ", e);
            });
    },


    parseEpgDate: function(dateStr) {
        if (!dateStr) return 0;
        var clean = dateStr.replace(/[^0-9]/g, "").substring(0, 14);
        if (clean.length < 14) return 0;

        var year = parseInt(clean.substring(0, 4), 10);
        var month = parseInt(clean.substring(4, 6), 10) - 1;
        var day = parseInt(clean.substring(6, 8), 10);
        var hour = parseInt(clean.substring(8, 10), 10);
        var min = parseInt(clean.substring(10, 12), 10);
        var sec = parseInt(clean.substring(12, 14), 10);

        return new Date(year, month, day, hour, min, sec).getTime();
    }
};
