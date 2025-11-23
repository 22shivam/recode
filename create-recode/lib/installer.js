import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesDir = path.join(__dirname, "..", "templates");

export async function install(options) {
  const cwd = process.cwd();

  // Step 1: Validate environment
  const spinner = ora("Validating project structure...").start();
  await validateProject(cwd);
  spinner.succeed("Project structure validated");

  // Step 2: Gather configuration
  let config;
  if (options.yes) {
    config = {
      installOmi: options.omi !== false,
      apiKeys: false, // Don't prompt for API keys in -y mode
    };
  } else {
    config = await promptConfig(options);
  }

  // Step 3: Copy agent files
  spinner.start("Installing ReCode agent...");
  await copyAgentFiles(cwd);
  spinner.succeed("Agent files installed");

  // Step 4: Copy Convex schema files
  spinner.start("Setting up Convex schema...");
  await copyConvexFiles(cwd);
  spinner.succeed("Convex schema updated");

  // Step 5: Copy dashboard files
  spinner.start("Installing dashboard...");
  await copyDashboardFiles(cwd);
  spinner.succeed("Dashboard installed");

  // Step 6: Install Omi integration (optional)
  if (config.installOmi) {
    spinner.start("Installing Omi integration...");
    await copyOmiFiles(cwd);
    spinner.succeed("Omi integration installed");
  }

  // Step 7: Install dependencies
  spinner.start("Installing npm dependencies...");
  await installDependencies(cwd, config.installOmi);
  spinner.succeed("Dependencies installed");

  // Step 8: Generate .env template
  spinner.start("Generating .env template...");
  await generateEnvTemplate(cwd, config);
  spinner.succeed(".env template created");

  // Step 9: Print success message
  printSuccessMessage(config);
}

async function validateProject(cwd) {
  // Check for convex folder
  const convexPath = path.join(cwd, "convex");
  if (!fs.existsSync(convexPath)) {
    throw new Error(
      "No convex/ folder found. Make sure you're in a Convex project root."
    );
  }

  // Check for package.json
  const packageJsonPath = path.join(cwd, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error("No package.json found. Make sure you're in a project root.");
  }

  // Check if it's a Next.js project (required for dashboard)
  const packageJson = await fs.readJSON(packageJsonPath);
  const hasNextJs = packageJson.dependencies?.next || packageJson.devDependencies?.next;

  if (!hasNextJs) {
    throw new Error(
      "Next.js not detected. ReCode requires Next.js + Convex. Run 'npx create-next-app' first."
    );
  }

  // Check for app directory
  const appPath = path.join(cwd, "app");
  if (!fs.existsSync(appPath)) {
    throw new Error(
      "No app/ directory found. ReCode requires Next.js App Router."
    );
  }

  return true;
}

async function promptConfig(options) {
  const questions = [
    {
      type: options.omi === false ? null : "confirm",
      name: "installOmi",
      message: "Install Omi voice integration? (optional)",
      initial: true,
    },
    {
      type: "confirm",
      name: "apiKeys",
      message: "Do you have API keys ready? (Anthropic, OpenAI)",
      initial: false,
    },
  ];

  return await prompts(questions.filter((q) => q.type !== null));
}

async function copyAgentFiles(cwd) {
  const agentSrc = path.join(templatesDir, "agent");
  const agentDest = path.join(cwd, "agent");

  await fs.copy(agentSrc, agentDest, { overwrite: false });
}

async function copyConvexFiles(cwd) {
  const convexSrc = path.join(templatesDir, "convex");
  const convexDest = path.join(cwd, "convex");

  // Copy errors.ts and fixes.ts (not schema.ts - we'll merge that)
  await fs.copy(path.join(convexSrc, "errors.ts"), path.join(convexDest, "errors.ts"), { overwrite: false });
  await fs.copy(path.join(convexSrc, "fixes.ts"), path.join(convexDest, "fixes.ts"), { overwrite: false });

  // Merge schema.ts
  await mergeSchema(cwd);
}

async function mergeSchema(cwd) {
  const schemaPath = path.join(cwd, "convex", "schema.ts");

  if (!fs.existsSync(schemaPath)) {
    // No existing schema, copy template
    await fs.copy(
      path.join(templatesDir, "convex", "schema.ts"),
      schemaPath
    );
    return;
  }

  // Read existing schema
  let schemaContent = await fs.readFile(schemaPath, "utf-8");

  // Check if ReCode tables already exist
  if (schemaContent.includes("errors:") && schemaContent.includes("fixes:")) {
    console.log(chalk.gray("   Schema already has ReCode tables, skipping merge"));
    return;
  }

  // Find the closing brace of defineSchema
  const defineSchemaMatch = schemaContent.match(/export default defineSchema\s*\(\s*\{/);
  if (!defineSchemaMatch) {
    console.log(chalk.yellow("   ⚠️  Could not parse schema, please add tables manually"));
    return;
  }

  // Find the last closing brace before the semicolon
  const lastClosingBrace = schemaContent.lastIndexOf("});");
  if (lastClosingBrace === -1) {
    console.log(chalk.yellow("   ⚠️  Could not parse schema, please add tables manually"));
    return;
  }

  // Insert ReCode tables before the closing brace
  const recodeSchema = `
  // ReCode error tracking
  errors: defineTable({
    functionName: v.string(),
    errorMessage: v.string(),
    stackTrace: v.optional(v.string()),
    timestamp: v.number(),
    resolved: v.boolean(),
  }).index("by_resolved", ["resolved"]),

  // ReCode fix management
  fixes: defineTable({
    errorId: v.id("errors"),
    errorPattern: v.optional(v.string()),
    embedding: v.optional(v.array(v.float64())),
    originalCode: v.string(),
    fixedCode: v.string(),
    reasoning: v.string(),
    timestamp: v.number(),
    confidence: v.optional(v.number()),
    status: v.optional(v.string()),
    appliedAt: v.optional(v.number()),
    effectiveness: v.optional(v.number()),
    timesApplied: v.optional(v.number()),
  })
    .index("by_error", ["errorId"])
    .index("by_status", ["status"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["errorPattern"],
    }),
`;

  // Insert before the closing brace with a comma if needed
  const beforeClosing = schemaContent.substring(0, lastClosingBrace).trimEnd();
  const needsComma = !beforeClosing.endsWith(",") && !beforeClosing.endsWith("{");

  const updatedSchema =
    beforeClosing +
    (needsComma ? "," : "") +
    recodeSchema +
    schemaContent.substring(lastClosingBrace);

  await fs.writeFile(schemaPath, updatedSchema);
}

async function copyDashboardFiles(cwd) {
  const dashboardSrc = path.join(templatesDir, "dashboard");
  const dashboardDest = path.join(cwd, "app", "recode");

  await fs.copy(dashboardSrc, dashboardDest, { overwrite: false });
}

async function copyOmiFiles(cwd) {
  const omiSrc = path.join(templatesDir, "omi");
  const omiDest = path.join(cwd, "omi");

  await fs.copy(omiSrc, omiDest, { overwrite: false });
}

async function installDependencies(cwd, includeOmi) {
  const agentDeps = [
    "@anthropic-ai/sdk",
    "openai",
    "convex",
    "axios",
    "dotenv",
  ];

  const omiDeps = includeOmi
    ? ["express", "commander", "chalk", "ora", "prompts"]
    : [];

  const allDeps = [...agentDeps, ...omiDeps];

  // Install in agent/ folder
  const agentPath = path.join(cwd, "agent");
  execSync(`cd "${agentPath}" && npm install ${agentDeps.join(" ")}`, {
    stdio: "ignore",
  });

  // Install Omi dependencies if needed
  if (includeOmi) {
    const omiPath = path.join(cwd, "omi");
    execSync(`cd "${omiPath}" && npm install ${omiDeps.join(" ")}`, {
      stdio: "ignore",
    });
  }
}

async function generateEnvTemplate(cwd, config) {
  const envPath = path.join(cwd, ".env.local");
  const envExamplePath = path.join(cwd, ".env.local.example");

  // Check if .env.local already exists and has keys
  let existingEnv = {};
  if (fs.existsSync(envPath)) {
    try {
      const content = await fs.readFile(envPath, "utf-8");
      // Parse existing .env file
      content.split("\n").forEach((line) => {
        const [key, ...valueParts] = line.split("=");
        if (key && valueParts.length > 0) {
          existingEnv[key.trim()] = valueParts.join("=").trim();
        }
      });
    } catch (err) {
      // Ignore parse errors
    }
  }

  // Use existing keys or prompt user to add them
  const anthropicKey = existingEnv.ANTHROPIC_API_KEY || "your_anthropic_key_here";
  const openaiKey = existingEnv.OPENAI_API_KEY || "your_openai_key_here";
  const convexUrl = existingEnv.NEXT_PUBLIC_CONVEX_URL || "your_convex_url_here";

  let envContent = `# ReCode Configuration
# API keys pre-configured for demo purposes

ANTHROPIC_API_KEY=${anthropicKey}
OPENAI_API_KEY=${openaiKey}
NEXT_PUBLIC_CONVEX_URL=${convexUrl}
`;

  if (config.installOmi) {
    const omiUid = existingEnv.OMI_UID || "Kn1m7UlchXY7CfazqKWstxkEV7d2";
    const omiAppId = existingEnv.OMI_APP_ID || "01KAPVYWFY6KP6BR03FA7961E1";
    const omiAppSecret = existingEnv.OMI_APP_SECRET || "sk_5b3d742f919bd146d530a77dd7f82b49";

    envContent += `
# Omi Integration (optional)
OMI_UID=${omiUid}
OMI_APP_ID=${omiAppId}
OMI_APP_SECRET=${omiAppSecret}
`;
  }

  // Write .env.local (overwrite with configured keys)
  await fs.writeFile(envPath, envContent);

  // Also write example
  await fs.writeFile(envExamplePath, envContent);
}

function printSuccessMessage(config) {
  console.log(chalk.bold.green("\n✅ ReCode installed successfully!\n"));

  console.log(chalk.bold("📋 Next steps:\n"));
  console.log(chalk.gray("1.") + " Configure your API keys in " + chalk.cyan(".env.local"));
  console.log(
    chalk.gray("2.") +
      " Wrap your Convex mutation handlers with " +
      chalk.cyan("wrapMutation()")
  );
  console.log(chalk.gray("   Example:"));
  console.log(chalk.dim('   import { wrapMutation } from "./errors";'));
  console.log(chalk.dim('   export const myMutation = mutation({'));
  console.log(chalk.dim('     args: { ... },'));
  console.log(chalk.dim('     handler: wrapMutation('));
  console.log(chalk.dim('       async (ctx, args) => { ... },'));
  console.log(chalk.dim('       "myFile.myMutation"'));
  console.log(chalk.dim('     ),'));
  console.log(chalk.dim('   });\n'));
  console.log(chalk.gray("3.") + " Start the agent: " + chalk.cyan("cd agent && npm start"));
  console.log(chalk.gray("4.") + " View the dashboard: " + chalk.cyan("http://localhost:3000/recode"));

  if (config.installOmi) {
    console.log(chalk.gray("5.") + " (Optional) Setup Omi: " + chalk.cyan("cd omi && npm start"));
  }

  console.log(chalk.bold.cyan("\n🎉 Your app can now heal itself!\n"));
}
