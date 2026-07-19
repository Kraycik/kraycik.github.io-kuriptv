/**
 * KÜR IPTV - Context Dialog & PIN Engine
 * Pultun OK və ya xüsusi düymələri basıldıqda açılan menyu və kilid mexanizmi
 */
var ContextDialogEngine = {
    focusedOptionIdx: 0,
    options: ["Kanala Bax", "Favoritlərinə Əlavə Et/Sil", "Kanalı Kilidlə (PIN)"],
    currentChannel: null,

    showContextMenu: function(channel) {
        this.currentChannel = channel;
        this.focusedOptionIdx = 0;
        if (window.AppCore) AppCore.currentFocusArea = "context_menu";
        
        var ui = document.getElementById("context-dialog-ui");
        if (ui) {
            ui.style.display = "flex";
            this.renderOptions();
        }
    },

    renderOptions: function() {
        var listEl = document.getElementById("context-options-list");
        if (!listEl) return;
        listEl.innerHTML = "";

        for (var i = 0; i < this.options.length; i++) {
            var opt = document.createElement("div");
            opt.className = "context-option-item";
            opt.id = "ctx_opt_" + i;
            opt.innerText = this.options[i];
            if (i === this.focusedOptionIdx) {
                opt.style.backgroundColor = "#2196F3";
                opt.style.color = "#ffffff";
            } else {
                opt.style.backgroundColor = "transparent";
                opt.style.color = "#ffffff";
            }
            listEl.appendChild(opt);
        }
    },

    focusOption: function(index) {
        this.focusedOptionIdx = index;
        this.renderOptions();
    },

    closeContextMenu: function() {
        var ui = document.getElementById("context-dialog-ui");
        if (ui) ui.style.display = "none";
    },

    handleOptionClick: function(index) {
        this.closeContextMenu();
        if (window.AppCore) AppCore.currentFocusArea = "channels";
        
        if (index === 0 && this.currentChannel && window.PlayerEngine) {
            PlayerEngine.actualPlay(this.currentChannel.url, this.currentChannel.name);
        } else if (index === 1 && this.currentChannel) {
            this.currentChannel.isFavorite = !this.currentChannel.isFavorite;
            if (window.ChannelAdapter) ChannelAdapter.render();
            alert("Favorit vəziyyəti dəyişdirildi!");
        }
    },

    checkPinAndPlay: function(channel) {
        if (window.PlayerEngine) {
            PlayerEngine.actualPlay(channel.url, channel.name);
        }
    },

    closePinDialog: function() {
        var pinUi = document.getElementById("pin-dialog-ui");
        if (pinUi) pinUi.style.display = "none";
    },

    handlePinInput: function(num) {
        console.log("PIN daxil edilir: " + num);
    }
};
