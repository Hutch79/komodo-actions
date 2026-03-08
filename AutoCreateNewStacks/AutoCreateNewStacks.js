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
var existingStackNames = stacks
  .filter(stack => !stack.template)
  .map(stack => stack.name.toLowerCase())

// Clone or pull the repo
console.log(`Cloning/pulling repo to: ${clonePath}`)
try {
  // Check if directory exists
  await Deno.stat(clonePath)
  // Directory exists, pull latest
  console.log(`Directory exists, pulling latest changes...`)
  
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
  await pullCmd.output()
} catch {
  // Directory doesn't exist, clone it
  console.log(`Cloning repo...`)
  var cloneCmd = new Deno.Command("git", {
    args: ["clone", authenticatedUrl, clonePath],
  })
  await cloneCmd.output()
}

// Read directories from the cloned repo
var entries = await Deno.readDir(clonePath)

// Get all directories (potential stacks), excluding those starting with '.'
var directories = []
for await (const entry of entries) {
  if (entry.isDirectory && !entry.name.startsWith('.')) {
    directories.push(entry.name)
  }
}

console.log(`Found directories: ${directories.join(', ')}`)

// Create stacks for directories that don't exist yet
for (const dirName of directories) {
  var stackName = dirName.toLowerCase()
  
  if (!existingStackNames.includes(stackName)) {
    console.log(`Creating new stack: ${stackName} (from directory: ${dirName})`)
    
    var edits = {
      run_directory: dirName
    }
    
    var newStack = await komodo.write('CopyStack', { name: stackName, id: templateId })
    await komodo.write('UpdateStack', { id: newStack._id.$oid, config: edits })

    var currentTags = newStack.tags || []
    var updatedTags = [...currentTags, gitOpsTagId]
    await komodo.write('UpdateResourceMeta', { 
        target: { type: "Stack", id: newStack._id.$oid},
        tags: updatedTags
      })
    
    console.log(`Successfully created stack: ${stackName}`)
  } else {
    console.log(`Stack already exists: ${stackName} - skipping`)
  }
}
