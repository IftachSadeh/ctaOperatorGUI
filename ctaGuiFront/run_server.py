import uvicorn

from ctaGuiFront.py.utils.server_args import parse_args

is_dev = True
# is_dev = False

settings = parse_args()

app = 'ctaGuiFront.py.utils.server_setup:app'

conf = { 
    'host': str(settings['app_host']), 
    'port': int(settings['app_port']),
    'workers': int(settings['app_workers']),
}

# defined the directories to watch for changes (development purpose only)
reload_dirs = []
base_dir = '../ctaGuiFront/ctaGuiFront/'
reload_dirs += [
    base_dir + 'js',
    base_dir + 'py',
    base_dir + 'templates/',
]
base_dir = '../ctaGuiUtils/'
reload_dirs += [
    base_dir + 'py',
]
base_dir = '../ctaGuiBack/ctaGuiBack/'
reload_dirs += [
    base_dir + 'py',
    base_dir + 'acs',
]
if is_dev:
    conf.update({
        'reload': True,  
        'reload_dirs': reload_dirs,
    })

# ------------------------------------------------------------------
# see: https://docs.python.org/3/library/asyncio.html
# see: https://asgi.readthedocs.io/en/latest/specs/main.html
# see: https://www.uvicorn.org/
# ------------------------------------------------------------------
if __name__ == "__main__":

    try:
        uvicorn.run(
            app, **conf
        )
    except Exception as e:
        print('--'*40)
        print(e)

