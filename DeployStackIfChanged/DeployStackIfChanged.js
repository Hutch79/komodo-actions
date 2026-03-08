var stacks = await komodo.read('ListStacks', {})

var filteredStacks = stacks
  .filter(stack => !stack.template && ['running', 'unhealthy', 'stopped'].includes(stack.info.state))
  .map(stack => [stack.id, stack.name])

for (const [id, name] of filteredStacks) {
  console.log(`Processing stack: ${name} (${id})`)
  await komodo.execute('DeployStackIfChanged', { stack: id })
}
