.PHONY: dev build sync-docs sync-check deploy clean

# Development server
dev:
	pnpm dev

# Production build
build:
	pnpm build

# Sync documentation from Martis package
sync-docs:
	./scripts/sync-docs.sh

# Check for documentation drift (fails if out of sync)
sync-check:
	./scripts/sync-docs.sh --check

# Sync docs + build + deploy
deploy: sync-docs build
	@echo "Deployed to /home/martis/martis-docs/dist"

# Rebuild without sync (use when content is already up to date)
rebuild:
	pnpm build

# Clean build artifacts
clean:
	rm -rf dist/

# Full CI check: sync check + build
ci: sync-check build
