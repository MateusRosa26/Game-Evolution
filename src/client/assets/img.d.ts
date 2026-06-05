// Imports de imagem via Vite (URL do asset processado no build).
declare module "*.png" {
  const url: string;
  export default url;
}
