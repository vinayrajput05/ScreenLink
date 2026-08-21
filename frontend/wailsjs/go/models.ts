export namespace capture {
	
	export class QualityPreset {
	    id: string;
	    name: string;
	    description: string;
	    maxHeight: number;
	    quality: number;
	    targetFps: number;
	
	    static createFrom(source: any = {}) {
	        return new QualityPreset(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.maxHeight = source["maxHeight"];
	        this.quality = source["quality"];
	        this.targetFps = source["targetFps"];
	    }
	}

}

export namespace clients {
	
	export class ClientDTO {
	    id: string;
	    displayName: string;
	    ip: string;
	    browser: string;
	    state: string;
	    requestedAt: string;
	    connectedAt: string;
	    durationMinutes: number;
	    bandwidthKbps: number;
	    latencyMs: number;
	    signalBars: number;
	
	    static createFrom(source: any = {}) {
	        return new ClientDTO(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.displayName = source["displayName"];
	        this.ip = source["ip"];
	        this.browser = source["browser"];
	        this.state = source["state"];
	        this.requestedAt = source["requestedAt"];
	        this.connectedAt = source["connectedAt"];
	        this.durationMinutes = source["durationMinutes"];
	        this.bandwidthKbps = source["bandwidthKbps"];
	        this.latencyMs = source["latencyMs"];
	        this.signalBars = source["signalBars"];
	    }
	}

}

export namespace main {
	
	export class ClientsPayload {
	    pending: clients.ClientDTO[];
	    connected: clients.ClientDTO[];
	
	    static createFrom(source: any = {}) {
	        return new ClientsPayload(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.pending = this.convertValues(source["pending"], clients.ClientDTO);
	        this.connected = this.convertValues(source["connected"], clients.ClientDTO);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class DisplayInfo {
	    id: string;
	    name: string;
	    resolution: string;
	    isPrimary: boolean;
	
	    static createFrom(source: any = {}) {
	        return new DisplayInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.resolution = source["resolution"];
	        this.isPrimary = source["isPrimary"];
	    }
	}
	export class SystemInfo {
	    ipAddresses: string[];
	    defaultPort: number;
	    version: string;
	
	    static createFrom(source: any = {}) {
	        return new SystemInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ipAddresses = source["ipAddresses"];
	        this.defaultPort = source["defaultPort"];
	        this.version = source["version"];
	    }
	}

}

export namespace server {
	
	export class ChatMessage {
	    id: string;
	    type: string;
	    title?: string;
	    message: string;
	    language?: string;
	    isCode: boolean;
	    sentAt: string;
	    sender: string;
	
	    static createFrom(source: any = {}) {
	        return new ChatMessage(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.type = source["type"];
	        this.title = source["title"];
	        this.message = source["message"];
	        this.language = source["language"];
	        this.isCode = source["isCode"];
	        this.sentAt = source["sentAt"];
	        this.sender = source["sender"];
	    }
	}

}

