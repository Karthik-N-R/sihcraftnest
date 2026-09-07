const fs = require('fs');
const path = require('path');
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');

const dir = path.join(__dirname, '..');
const remoteUrl = 'https://github.com/Karthik-N-R/SIH-MARKET.git';

async function pushRepo(token) {
  try {
    console.log("Checking git repository at:", dir);

    // Initialize if needed
    try {
      await git.init({ fs, dir, defaultBranch: 'main' });
      console.log("Git repo initialized.");
    } catch (e) {
      console.log("Git repo init status:", e.message);
    }

    // Get current branch
    let currentBranch = 'main';
    try {
      currentBranch = (await git.currentBranch({ fs, dir })) || 'main';
      console.log("Current local branch:", currentBranch);
    } catch (e) {
      console.log("Branch detection:", e.message);
    }

    // Add all project files
    console.log("Staging files...");
    await git.add({ fs, dir, filepath: 'src' });
    await git.add({ fs, dir, filepath: 'public' });
    await git.add({ fs, dir, filepath: 'package.json' });
    await git.add({ fs, dir, filepath: 'package-lock.json' });
    await git.add({ fs, dir, filepath: 'next.config.mjs' });
    await git.add({ fs, dir, filepath: 'README.md' });

    // Commit
    console.log("Committing changes...");
    try {
      const sha = await git.commit({
        fs,
        dir,
        author: {
          name: 'Karthik N R',
          email: 'karthik@craftnest.dev',
        },
        message: 'Implement seller voice pipeline and mandatory field collection',
      });
      console.log("Committed commit SHA:", sha);
    } catch (err) {
      console.log("Commit notice:", err.message);
    }

    // Push to GitHub remote
    console.log(`Pushing branch '${currentBranch}' to ${remoteUrl}...`);
    const pushResult = await git.push({
      fs,
      http,
      dir,
      remote: 'origin',
      url: remoteUrl,
      ref: currentBranch,
      remoteRef: 'main',
      force: true,
      onAuth: () => {
        if (!token) {
          throw new Error("GitHub Authentication Required. Please provide a Personal Access Token (PAT).");
        }
        return { username: token, password: '' };
      }
    });

    console.log("SUCCESS! Pushed to GitHub repository:", remoteUrl);
    console.log("Push Result Detail:", pushResult);

  } catch (error) {
    console.error("Push Error:", error.message);
    if (error.message.includes("Authentication Required")) {
      console.log("\nAuthentication Note: To authorize push, pass your GitHub Personal Access Token as an argument:");
      console.log("node scripts/push_to_github.js YOUR_GITHUB_TOKEN");
    }
    process.exit(1);
  }
}

const token = process.argv[2] || process.env.GITHUB_TOKEN || '';
pushRepo(token);
