declare module "cbor-web" {
  const encode: (input: any) => Uint8Array
  const decode: (input: Uint8Array) => any
  export { encode, decode }
}
