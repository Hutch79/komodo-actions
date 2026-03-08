var templateId = "" // Open the Template and copy the ID from the URL
var repoResourceName = "HomeLab-Composes" // Enter the Name of your Repo 
var repoUrl = "https://github.com/User/Composes.git"  // your repo URL (ending with .git)
var gitUsername = "Komodo.Stack-Auto-Creator"  // Your git username
var gitToken = "3405e300ea93b62a9f34c4dfe92f5b2170d5b465" // Your Git token (read only is enough)
var clonePath = "/tmp/homelab-composes" // Paht where to clone the repo to
var gitOpsTagId = "69553e1f30285d708d4faade" // The Tag to add to resources, which where created by this script

var authenticatedUrl = repoUrl.replace("https://", `https://${gitUsername}:${gitToken}@`)
 
// Get all existing stacks (non-templates)
var stacks = await komodo.read('ListStacks', {})
var activeStacks = stacks.filter(stack => !stack.template)
console.log(`Total stacks found in Komodo: ${activeStacks.length}`)

// Clone or pull the repo
try {
  // Check if directory exists
  await Deno.stat(clonePath)
  // Directory exists, pull latest
  
  // Update remote URL with credentials
  var remoteCmd = new Deno.Command("git", {
    args: ["remote", "set-url", "origin", authenticatedUrl],
    cwd: clonePath,
  })
  await remoteCmd.output()
  
  var pullCmd = new Deno.Command("git", {
    args: ["pull"],
    cwd: clonePath,
  })
  var pullResult = await pullCmd.output()
} catch {
  // Directory doesn't exist, clone it
  console.log(`Directory doesn't exist, cloning repo...`)
  var cloneCmd = new Deno.Command("git", {
    args: ["clone", authenticatedUrl, clonePath],
  })
  await cloneCmd.output()
}

// Read directories from the cloned repo
var entries = await Deno.readDir(clonePath)

// Get all directories (potential stacks)
var gitDirectories = []
for await (const entry of entries) {
  if (entry.isDirectory && entry.name !== '.git') {
    gitDirectories.push(entry.name.toLowerCase())
  }
}

console.log(`Found ${gitDirectories.length} directories in Git:`)

// Count stacks by category
var gitOpsStacks = activeStacks.filter(s => s.tags && s.tags.includes(gitOpsTagId))
var alreadyMarkedStacks = gitOpsStacks.filter(s => s.tags && s.tags.includes(removedFromGitTagId))

// Check each stack to see if it's been removed from Git
console.log(`\n=== Processing Stacks ===`)
var processedCount = 0
var skippedCount = 0
var removedCount = 0
var errorCount = 0

for (const stack of activeStacks) {
  var stackName = stack.name.toLowerCase()
  var stackId = stack.id
  
  // Only process stacks with the GitOps tag
  if (!stack.tags || !stack.tags.includes(gitOpsTagId)) {
    console.log(`⊝ Skipped: ${stackName}`)
    skippedCount++
    continue
  }
  
  // Skip if stack already has "Removed from Git" tag
  if (stack.tags.includes(removedFromGitTagId)) {
    console.log(`⊗ Already removed: ${stackName}`)
    skippedCount++
    continue
  }
  
  processedCount++
  
  // Check if this stack's directory no longer exists in Git
  if (!gitDirectories.includes(stackName)) {
    try {
      // Stop the stack
      await komodo.execute('StopStack', { stack: stackId })
      
      // Add "Removed from Git" tag using UpdateResourceMeta
      var currentTags = stack.tags || []
      var updatedTags = [...currentTags, removedFromGitTagId]

      await komodo.write('UpdateResourceMeta', { 
        target: { type: "Stack", id: stackId},
        tags: updatedTags
      })

      console.log(`🗑️  Removed: ${stackName}`)
      removedCount++
      
    } catch (error) {
      console.error(`✗ Error: ${stackName} - ${error}`)
      errorCount++
    }
  } else {
    console.log(`✓ Active: ${stackName}`)
  }
}

console.log(`\n=== Removal Check Complete ===`)
console.log(`Total stacks processed: ${processedCount}`)
console.log(`Stacks marked as removed: ${removedCount}`)
console.log(`Stacks skipped: ${skippedCount}`)
console.log(`Errors encountered: ${errorCount}`)
console.log(`=================================`)
