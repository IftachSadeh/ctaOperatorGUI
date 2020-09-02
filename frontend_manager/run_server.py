import uvicorn
from shared.server_args import parse_args

is_dev = True
# is_dev = False

settings = parse_args(app_name='frontend_manager')

app = 'frontend_manager.py.utils.server_setup:app'

conf = {
    'host': str(settings['app_host']),
    'port': int(settings['app_port']),
    'workers': int(settings['app_workers']),
}

# defined the directories to watch for changes (development purpose only)
reload_dirs = []
base_dir = '../frontend_manager/'
reload_dirs += [
    base_dir + 'js/',
    base_dir + 'py/',
    base_dir + 'templates/',
    base_dir + 'styles/',
]
base_dir = '../shared/'
reload_dirs += [
    base_dir + './',
]
base_dir = '../data_manager/'
reload_dirs += [
    base_dir + 'py/',
    base_dir + 'acs/',
]
if is_dev:
    conf.update({
        'reload': settings['reload'],
        'reload_dirs': reload_dirs,
    })

# ------------------------------------------------------------------
# see: https://docs.python.org/3/library/asyncio.html
# see: https://asgi.readthedocs.io/en/latest/specs/main.html
# see: https://www.uvicorn.org/
# ------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run(app, **conf)
