from setuptools import setup
from setuptools import find_packages 

requires = [
    'pyramid',
    'asgiref',
    'uvicorn[watchgodreload]',
    'pyramid_mako',
    'zope.interface',
    'zope.sqlalchemy',
    'zope.deprecation',
    'SQLAlchemy',
    'transaction',
    'filelock',
    'importlib-metadata',
    'bcrypt',
    'redis',
    'msgpack-python',
    'numpy',
    'pep8',
    'yapf',
    'sphinx',
    'sphinx-js',
    'sphinx-astropy',
    'sphinx_rtd_theme',
]

setup(
    name='hmi',
    version='0.0',
    packages=find_packages(),
    include_package_data=True,
    zip_safe=False,
    install_requires=requires,
)
