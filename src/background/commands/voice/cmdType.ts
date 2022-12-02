export enum CmdType{
    Query = 0x21,
    VoiceSynthesis = 0x01,
    CloseSynthesis = 0x02,
    StopSynthesis = 0x03,
    StartSynthesis = 0x04,
    PowerSaving = 0x88,
    Normal = 0xFF
}