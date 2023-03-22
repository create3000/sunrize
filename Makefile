x_ite-for-sunrize:
	cd ../x_ite && ${MAKE} dist
	rsync -a --delete --exclude=".*" ../x_ite/ ./x_ite/
	cd ../x_ite && ${MAKE} checkout-dist
