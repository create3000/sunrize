x_ite-for-sunrize:
	cd ../x_ite && ${MAKE} dist
	rsync -a --delete --exclude=".*" ../x_ite/ ./x_ite/
	cd ../x_ite && ${MAKE} checkout-dist

.PHONY: docs
docs:
	cd docs && bundle exec jekyll serve --incremental

publish:
	perl build/publish.pl
