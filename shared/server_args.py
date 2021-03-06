import argparse
import os


def parse_args(app_name):
    parser = argparse.ArgumentParser(description='Command line parser:')
    parser.add_argument(
        '--site_type',
        type=str,
        default=None,
    )
    parser.add_argument(
        '--app_port',
        type=int,
        default=None,
    )
    parser.add_argument(
        '--app_host',
        type=str,
        default=None,
    )
    parser.add_argument(
        '--reload',
        type=str_to_bool,
        nargs='?',
        const=True,
        default='True',
    )
    parser.add_argument(
        '--redis_port',
        type=int,
        default=None,
    )
    parser.add_argument(
        '--app_workers',
        type=int,
        default=1,
    )
    parser.add_argument(
        '--log_file',
        type=str,
        default=None,
    )
    parser.add_argument(
        '--log_level',
        type=str,
        default=None,
    )
    parser.add_argument(
        '--debug_opts',
        type=str,
        default=None,
    )
    parser.add_argument(
        '--is_simulation',
        type=str_to_bool,
        nargs='?',
        const=True,
        default='True',
    )
    parser.add_argument(
        '--do_flush_redis',
        type=str_to_bool,
        nargs='?',
        const=True,
        default='False',
    )
    parser.add_argument(
        '--allow_panel_sync',
        type=str_to_bool,
        nargs='?',
        const=True,
        default='True',
    )
    input_args = vars(parser.parse_args())

    try:
        module_names = ['data_manager', 'frontend_manager', 'shared']

        # list here all views, which use the shared view function
        # these would eg be mapped to: [ http://localhost:8090/cta/view200 ]
        widget_info = [
            'view102',
            'view000',
            'view001',
            'view200',
            'view201',
            'view202',
            'view203',
            'view204',
            'view205',
            'view206',
            'view207',
            # 'myNewView',
        ]

        # for safety, make sure registered widgets can be requested by the client
        # e.g., expect a module file named 'AAA.py', containing a class AAA
        allowed_widget_types = {
            'synced': [
                'ArrayZoomer',
                'PlotsDash',
                'SubArrGrp',
                'telPntSky',
                'SchedBlocks',
                'NightSched',
                'inst_pos_0',
                'ObsBlockControl',
                'EmptyExample',
                'CommentSched',
                'SchedBlockController',
                'SchedBlockInspector',
                'WeatherMonitoring',
                # 'TestExample',
            ],
            'not_synced': [
                'PanelSync',
            ]
        }

        pwd = os.getcwd()
        sqlite = 'sqlite:////' + os.path.join(pwd, (app_name + '.db'))
        # 'sqlite://///Users/sadeh/test/ctaOperatorGUI/ctaGuiFront/ctaGuiFront.db',

        log_dir = '../logs'
        try:
            os.mkdir(log_dir)
        except FileExistsError:
            pass
        except Exception as e:
            raise e

        settings = {
            'app_name': app_name,
            'app_prefix': 'cta',
            'app_host': '0.0.0.0',
            'log_file': log_dir + '/' + app_name + '_server.log',
            'log_level': 'INFO',
            'pyramid.reload_templates': 'true',
            'sqlalchemy.url': sqlite,
            'module_names': module_names,
            'widget_info': widget_info,
            'allowed_widget_types': allowed_widget_types,
        }

        if input_args['site_type'] == 'N':
            settings.update({
                'app_port': '8090',
                'redis_port': '8091',
            })
        elif input_args['site_type'] == 'S':
            settings.update({
                'app_port': '8095',
                'redis_port': '8096',
            })
        else:
            raise ValueError('must specify --site_type as "N" or "S"')

        # debugging options
        allowed_debug_opts = {
            'dev': True,
            'redis': True,
            'lock': False,
        }
        if input_args['debug_opts'] is None:
            input_debugs = []
        else:
            input_debugs = str(input_args['debug_opts']).split(',')

        settings['debug_opts'] = dict()
        for debug in allowed_debug_opts.keys():
            settings['debug_opts'][debug] = (
                True if (debug in input_debugs) else allowed_debug_opts[debug]
            )

        # update by user-parameters
        for k, v in input_args.items():
            if v is not None:
                settings[k] = v

        # some sanity checks after accepting the user-parameters
        if settings['log_level'] not in ['DEBUG', 'INFO', 'WARN', 'ERROR']:
            raise Exception('unsupported log_level', settings['log_level'])

    except Exception as e:
        raise e

    return settings


#
def str_to_bool(v):
    if v.lower() in ('yes', 'true', 't', 'y', '1'):
        return True
    elif v.lower() in ('no', 'false', 'f', 'n', '0'):
        return False
    else:
        raise argparse.ArgumentTypeError('Boolean value expected')
