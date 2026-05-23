# Convenience targets for the personal-site repo.
# Run with:  make <target>

PYTHON ?= python3
PORT   ?= 8000

.PHONY: help serve sitemap links predeploy clean

help:                ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## ' Makefile | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

serve:               ## Serve the site locally (PORT=8000)
	@./scripts/serve.sh $(PORT)

sitemap:             ## Regenerate sitemap.xml from current HTML files
	@$(PYTHON) scripts/generate_sitemap.py

links:               ## Check all internal links resolve
	@$(PYTHON) scripts/check_links.py

predeploy: sitemap links  ## Run all checks before pushing
	@echo "All checks passed."

clean:               ## Remove generated artifacts (currently none)
	@echo "Nothing to clean."
