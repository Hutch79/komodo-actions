# komodo-actions

> Disclaimer: These “actions” are intended to be used **inside Komodo** (they run in Komodo’s automation/scripting context).

## Actions in this repo

- **AutoCreateNewStacks** (`AutoCreateNewStacks/AutoCreateNewStacks.js`)
- **DeployStackIfChanged** (`DeployStackIfChanged/DeployStackIfChanged.js`)
- **TagAndStopRemovedStacks** (`TagAndStopRemovedStacks/TagAndStopRemovedStacks.js`)

## AutoCreateNewStacks

Creates new Komodo stacks automatically based on directories found in a Git repository.  
If a stack doesn’t exist yet, it copies from a template and sets the `run_directory`.  
Useful for quickly bootstrapping stacks when you add new folders to your repo.

## DeployStackIfChanged

Iterates over non-template stacks and runs Komodo’s `DeployStackIfChanged` operation for each.  
It targets stacks that are in common runnable states (running/unhealthy/stopped).  
Useful as a scheduled “keep things deployed” job without forcing unnecessary redeploys.

## TagAndStopRemovedStacks

Checks GitOps-managed stacks against the directories currently present in a Git repository.  
If a stack’s directory was removed from Git, it stops the stack and tags it as removed.  
Useful for automatically decommissioning stacks that no longer exist in source control.