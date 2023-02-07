class AnalyticService {
    constructor(provider) {
        this.provider = provider;
    }

    init(){
        this.provider.init()
    }
    sendEvent(event) {
        this.provider.sendEvent(event);
    }
}

const plausibleProvider = {
    init(){
        window.plausible = window.plausible || function() {
            (window.plausible.q = window.plausible.q || []).push(arguments)
        };
    },
    sendEvent({type, ...data}) {
        plausible(type, data)
    },
};

const analyticService = new AnalyticService(plausibleProvider);
analyticService.init();
