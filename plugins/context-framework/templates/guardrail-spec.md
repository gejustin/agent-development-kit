# Guardrail Spec: <name>

## Rule

<One imperative sentence. Falsifiable.>

## Scope

- **Paths:** <which files or globs>
- **Events:** <when the check runs — on save, on commit, on CI>

## Enforcement mechanism

- **Tool:** <lint | typecheck | CI job | git hook | formatter | harness hook>
- **Package or config:** <exact location where the rule will be implemented>
- **Owner:** <team or individual>

## Example — violation

```<language>
<Concrete code or repo state that violates the rule.>
```

## Example — pass

```<language>
<Concrete code or repo state that satisfies the rule.>
```

## Migration path

1. <Step one. Tool install, config change, or codemod.>
2. <Step two.>
3. <Target PR or issue link.>

## Until enforced

<How agents should behave until the machine enforcement lands. Optional, one paragraph. If this section would be longer than a paragraph, the rule is actually a guide, not a guardrail — reclassify.>

<!--
Guardrail-spec template. Use for rules that should be machine-enforced but are not yet implemented.

Do NOT author a guardrail-spec for a rule that cannot be mechanically checked. If the rule requires human judgment, write a guide instead.
Do NOT leave the migration path vague. If you cannot name the tool, config, or owner, the spec is not ready.
Do NOT let the "until enforced" section grow into a prose document. It is a stopgap, not a home.
-->
