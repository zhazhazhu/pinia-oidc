import nodeResolve from "@rollup/plugin-node-resolve";
import path from "path";
import ts from "rollup-plugin-typescript2";

export default {
  input: "src/index.ts",
  output: [
    {
      file: path.resolve(__dirname, "dist/index.js"),
      format: "cjs",
      sourcemap: true, // ts中的sourcemap也得变为true
    },
    {
      file: path.join(__dirname, "dist/index.esm.js"),
      format: "es",
      sourcemap: true, // ts中的sourcemap也得变为true
    },
  ],
  plugins: [
    // 这个插件是有执行顺序的
    nodeResolve({
      extensions: [".js", ".ts"],
    }),
    ts({
      removeComments: true,
      check: false,
      tsconfig: path.resolve(__dirname, "tsconfig.json"),
    }),
  ],
  external: ["oidc-client-ts"],
};
