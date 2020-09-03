from server_setup import SetupServer

# the name of the package
app_name = 'data_manager'

# defined the directories to watch for changes (development purpose only)
reload_dirs = []
# base_dir = '../frontend_manager/'
# reload_dirs += [
#     base_dir + 'js/',
#     base_dir + 'py/',
#     base_dir + 'templates/',
# ]
base_dir = '../shared/'
reload_dirs += [
    base_dir + './',
]
base_dir = '../data_manager/'
reload_dirs += [
    base_dir + './',
    base_dir + 'acs/',
]

# the list of services to run, and their configurations
services = [
    {
        'name': 'redis_flush',
        'is_blocking': True
    },
    {
        'name': 'redis_services',
        'is_blocking': False
    },
    {
        'name': 'time_of_night_service',
        'is_blocking': False
    },
    {
        'name': 'clock_sim_service',
        'is_blocking': False
    },
    {
        'name': 'inst_health_service',
        'is_blocking': False
    },
    {
        'name': 'inst_pos_service',
        'is_blocking': False
    },
    {
        'name': 'scheduler_service',
        'is_blocking': False
    },
]

# ------------------------------------------------------------------
if __name__ == "__main__":
    setup_server = SetupServer(
        app_name=app_name,
        reload_dirs=reload_dirs,
        services=services,
    )

    setup_server.run_server()
