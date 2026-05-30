import { Filter } from "@sevenqi/nodechannel";

/**
 * node-channel Filter that performs no framing: every chunk is forwarded
 * unchanged as a single frame. The application-level filters
 * (BaseFilter / VoiceFilter / HttpFilter) parse the raw Buffer downstream,
 * so the transport layer must hand them the bytes untouched.
 */
export default class PassThroughFilter implements Filter {
    decodePackage(buffer: Buffer): any[] {
        return [buffer];
    }
}
