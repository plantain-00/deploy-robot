declare module "get-port" {
    function getPort(): Promise<number>;
    export = getPort;
    namespace getPort { }
}
