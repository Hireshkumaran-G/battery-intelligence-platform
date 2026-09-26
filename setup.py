import setuptools

setuptools.setup(
    packages=setuptools.find_packages(include=["bip", "bip.*", "bip_api", "bip_api.*"]),
)