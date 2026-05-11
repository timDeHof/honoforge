/**
 * Generates legacy format only.
 */

import { execSync } from "node:child_process";
import process from "node:process";
import { Project, VariableDeclarationKind } from "ts-morph";

export interface JsonCodeComment {
  doc: string;
  description: string;
}

export interface JSONCode {
  code: number;
  phrase: string;
  constant: string;
  comment: JsonCodeComment;
  isDeprecated?: boolean;
}

const run = async () => {
  const project = new Project({
    tsConfigFilePath: "tsconfig.json",
  });
  const response = await fetch("https://raw.githubusercontent.com/prettymuchbryce/http-status-codes/refs/heads/master/codes.json");
  if (!response.ok) {
    throw new Error(`Error retrieving codes: ${response.statusText}`);
  }

  const Codes = await response.json() as JSONCode[];

  const statusCodeFile = project.createSourceFile("src/http-status-codes.ts", {}, {
    overwrite: true,
  });

  statusCodeFile.insertStatements(0, "// Generated file. Do not edit\n");
  statusCodeFile.insertStatements(1, `// Codes retrieved on ${new Date().toUTCString()} from https://raw.githubusercontent.com/prettymuchbryce/http-status-codes/refs/heads/master/codes.json`);

  Codes.forEach(({ code, constant, comment, isDeprecated }) => {
    statusCodeFile.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [{
        name: constant,
        initializer: code.toString(),
      }],
    }).addJsDoc({
      description: `${isDeprecated ? "@deprecated\n" : ""}${comment.doc}\n\n${comment.description}`,
    });
  });

  const phrasesFile = project.createSourceFile("src/http-status-phrases.ts", {}, {
    overwrite: true,
  });
  phrasesFile.insertStatements(0, "// Generated file. Do not edit\n");
  phrasesFile.insertStatements(1, `// Phrases retrieved on ${new Date().toUTCString()} from https://raw.githubusercontent.com/prettymuchbryce/http-status-codes/refs/heads/master/codes.json`);

  Codes.forEach(({ constant, phrase, comment, isDeprecated }) => {
    phrasesFile.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [{
        name: constant,
        initializer: `"${phrase}"`,
      }],
    }).addJsDoc({
      description: `${isDeprecated ? "@deprecated\n" : ""}${comment.doc}\n\n${comment.description}`,
    });
  });

  await project.save();
  await execSync("npx eslint --fix ./src/http-status-codes.ts ./src/http-status-phrases.ts");
  console.log("Successfully generated src/http-status-codes.ts and src/http-status-phrases.ts");
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
