import argparse
import os


def parse_args():
    app_name = 'ctaGuiFront'

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
        '--is_HMI_dev',
        type=str_to_bool,
        nargs='?',
        const=True,
        default='True',
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
        pwd = os.getcwd()
        sqlite = 'sqlite:////' + os.path.join(pwd, (app_name + '.db'))
        # 'sqlite://///Users/sadeh/test/ctaOperatorGUI/ctaGuiFront/ctaGuiFront.db',

        settings = {
            'app_name': app_name,
            'app_prefix': 'cta',
            'app_host': '0.0.0.0',
            'pyramid.reload_templates': 'true',
            'sqlalchemy.url': sqlite, 
        }

        if input_args['site_type'] == 'N':
            settings.update({
                'app_port': '8090',
                'redis_port': '6379',
            })
        elif input_args['site_type'] == 'S':
            settings.update({
                'app_port': '8091',
                'redis_port': '6378',
            })
        else:
            raise ValueError('must specify --site_type as "N" or "S"')

        for k,v in input_args.items():
            if v is not None:
                settings[k] = v

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
