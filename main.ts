import { generateFile, mapOpenApiEndpoints } from "typed-openapi";
import SwaggerParser from "@apidevtools/swagger-parser";
import type { OpenAPIObject } from "openapi3-ts/oas31";
import path from "node:path";

const glob = new Bun.Glob("./openapi/*.yaml");

const runtimes = [
  "zod",
  "arktype",
  "typebox",
  "valibot",
  "yup",
  "io-ts",
  "none",
] as const;

const cwd = process.cwd();
const now = new Date();

for await (const file of glob.scan(".")) {
  await Promise.allSettled(
    runtimes.map(async (_runtime) => {
      const runtime = _runtime === "none" ? "typescript" : _runtime;
      const fileName = path.basename(file);

      try {
        const openApiDoc = (await SwaggerParser.bundle(file)) as OpenAPIObject;
        const ctx = mapOpenApiEndpoints(openApiDoc);

        console.log(
          `<${fileName}> [${runtime}]: Found ${ctx.endpointList.length} endpoints`
        );

        const content = generateFile({ ...ctx, runtime: _runtime });
        const output = path.join(
          cwd,
          "./cases/" + runtime + `/${fileName.replace(".yaml", "")}.ts`
        );

        console.log("Generating...", output);
        await Bun.write(output, content);
      } catch (e) {
        console.log(`<${fileName}> [${runtime}]: Error while generating`);
        console.error(e);
      }
    })
  );
}

console.log(`Done in ${new Date().getTime() - now.getTime()}ms !`);
