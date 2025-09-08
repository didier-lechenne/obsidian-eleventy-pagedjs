#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Charger les clefs personnelles
const token = yaml.load(fs.readFileSync('./_11ty/_data/token.yml', 'utf8'));
const REPO_URL = token.repository_url;
const SITE_URL = token.site_url;

function run(command, options = {}) {
  try {
    execSync(command, { stdio: 'inherit', ...options });
  } catch (error) {
    console.error(`❌ Erreur: ${command}`);
    process.exit(1);
  }
}

function log(message) {
  console.log(`${message}`);
}

async function deploy() {
  log('🔨 Building with Eleventy...');
  run('npm run build');

  const siteDir = path.join(process.cwd(), '_site');
  
  if (!fs.existsSync(siteDir)) {
    console.error('❌ Le dossier _site n\'existe pas');
    process.exit(1);
  }

  log('📁 Deploying to Codeberg Pages...');
  process.chdir(siteDir);

  // Configuration Git
  const gitCommands = [
    'git init',
    'git remote remove origin 2>/dev/null || true',
    `git remote add origin ${REPO_URL}`,
    'git add .',
    `git commit -m "Deploy ${new Date().toISOString().slice(0, 16).replace('T', ' ')}"`,
    'git branch -M pages',
    'git push -f origin pages'
  ];

  gitCommands.forEach(cmd => {
    try {
      run(cmd, { stdio: cmd.includes('2>/dev/null') ? 'pipe' : 'inherit' });
    } catch (error) {
      if (!cmd.includes('2>/dev/null')) {
        throw error;
      }
    }
  });

  log(`✅ Site deployed to ${SITE_URL}`);
}

deploy().catch(error => {
  console.error('❌ Déploiement échoué:', error.message);
  process.exit(1);
});