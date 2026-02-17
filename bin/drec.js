#!/usr/bin/env node

import("../dist/cli/main.js")
  .then(module => {
    module.main();
  })
  .catch(err => {
    console.error("Failed to start drec:", err.message);
    process.exit(1);
  });
