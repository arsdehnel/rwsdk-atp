module "repo" {
  source = "github.com/arsdehnel/automation//open-tofu/modules/github-repo"

  repo_name        = var.repo_name
  repo_description = "Utilities for making a RedwoodSDK app work nicely on the AT Protocol"
  is_product       = false
  required_checks = [
    "plan-github-setup / plan-open-tofu",
    "run-tests / run-tests",
    "create-release-dry-run / create-release-dry-run",
    "lint-code / lint-code",
    "lint-commits / lint-commits",
  ]
}
