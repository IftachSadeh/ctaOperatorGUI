import uvicorn

# import logging


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


if __name__ == "__main__":
    uvicorn.run(
        "ctaGuiFront.py.server:app", host="0.0.0.0", port=8090, workers=1,
        reload=True,  reload_dirs=reload_dirs,
    )
