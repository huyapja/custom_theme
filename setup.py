from setuptools import setup, find_packages

setup(
    name="custom_theme",
    version="0.0.1",
    description="ERP custom theme by hieumc",
    author="hieumc",
    author_email="conghieu120@gmail.com",
    packages=find_packages(),
    include_package_data=True,
    install_requires=["frappe"],
)
