/**
 * KÜR IPTV - Tizen Search & Filter Engine (Klassik ES5)
 * ChannelsFragment.kt daxilindəki axtarış və filtr məntiqinin 100% rəsmi TV qarşılığı
 */
var SearchEngine = {
    searchQuery: "",
    isSearchOpen: false,

    /**
     * 🔍 [AXTARIŞ DIALOQU] - showSearchDialog() funksiyasının tam veb qarşılığı
     */
    showSearchDialog: function() {
        this.isSearchOpen = true;
        this.searchQuery = "";
        
        var searchUi = document.getElementById("search-dialog-ui");
        var inputEl = document.getElementById("search-input-field");
        
        if (searchUi && inputEl) {
            inputEl.value = "";
            searchUi.style.display = "flex";
            AppCore.currentFocusArea = "search_dialog";
            
            // Simulyatorda birbaşa fokuslanma sığortası
            setTimeout(function() {
                inputEl.focus();
            }, 100);
        }
        console.log("🔍 KÜR IPTV: Axtarış dialoqu aktivdir.");
    },

    /**
     * 🛡️ [KANAL FİLTRLƏMƏ ALQORİTMİ] - filterChannels(query) funksiyasının rəsmi qarşılığı
     */
    filterChannels: function(query) {
        this.searchQuery = query.trim();
        console.log("Filtrlənir: '" + this.searchQuery + "'");

        if (!window.ChannelRepository || !window.ChannelAdapter) return;
        
        var allChannels = ChannelRepository.getChannels();
        var filtered = [];

        if (this.searchQuery === "") {
            filtered = allChannels;
        } else {
            // Android .contains(query, ignoreCase = true) məntiqi
            for (var i = 0; i < allChannels.length; i++) {
                var ch = allChannels[i];
                if (ch.name && ch.name.toLowerCase().indexOf(this.searchQuery.toLowerCase()) !== -1) {
                    filtered.push(ch);
                }
            }
        }

        // Adapter məlumatlarını yeniləyirik
        ChannelAdapter._channels = filtered;
        ChannelAdapter._focusedIndex = 0;
        ChannelAdapter.render();

        // Siyahı boşdursa tvEmptyMessage sığortası
        var emptyMsg = document.getElementById("tvEmptyMessage");
        var recyclerView = document.getElementById("recyclerViewChannels");
        
        if (filtered.length === 0) {
            if (emptyMsg) emptyMsg.style.display = "block";
            if (recyclerView) recyclerView.style.display = "none";
        } else {
            if (emptyMsg) emptyMsg.style.display = "none";
            if (recyclerView) recyclerView.style.display = "block";
            
            // Axtarışdan sonra ilk kanalı avtomatik fokuslayırıq (TV post/postDelayed qarşılığı)
            setTimeout(function() {
                ChannelAdapter.focusItem(0);
            }, 150);
        }
    },

    closeSearchDialog: function() {
        this.isSearchOpen = false;
        var searchUi = document.getElementById("search-dialog-ui");
        if (searchUi) searchUi.style.display = "none";
    }
};
