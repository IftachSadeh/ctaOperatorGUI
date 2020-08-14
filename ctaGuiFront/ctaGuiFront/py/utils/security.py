from pyramid.security import Allow, Everyone
import bcrypt


def hash_password(pw):
    pwhash = bcrypt.hashpw(pw.encode('utf8'), bcrypt.gensalt())
    return pwhash.decode('utf8')


USERS = {
    'user0': hash_password('xxx'),
    'user1': hash_password('xxx'),
    'user2': hash_password('xxx'),
    'guest': hash_password('123'),
}
GROUPS = {
    'user0': ['group:permit_1'],
    'user1': ['group:permit_1'],
    'user2': ['group:permit_2'],
    'guest': ['group:permit_1'],
}


# ------------------------------------------------------------------
# define the fctory that sets user privliges
# see: http://docs.pylonsproject.org/projects/pyramid/en/latest/narr/security.html#protecting-views
# ------------------------------------------------------------------
class RootFactory(object):
    __name__ = None
    __parent__ = None
    __acl__ = [
        # every group must have permission to view the index and the sockets
        (Allow, 'group:permit_1', 'permit_all'),
        (Allow, 'group:permit_2', 'permit_all'),
        # 'group:permit_1' has permission to access pages defined by 'permit_a' and by 'permit_b'
        (Allow, 'group:permit_1', 'permit_a'),
        (Allow, 'group:permit_1', 'permit_b'),
        # 'group:permit_2' has permission to access pages defined by 'permit_b' only
        (Allow, 'group:permit_2', 'permit_b')
    ]

    # __acl__ = [ (Allow, Everyone,         'permit_0'),
    #             (Allow, 'group:permit_1', 'permit_1')
    #           ]

    def __init__(self, request):
        pass


def check_password(pw, hashed_pw):
    try:
        expected_hash = hashed_pw.encode('utf8')
        return bcrypt.checkpw(pw.encode('utf8'), expected_hash)
    except:
        return False


def groupfinder(userid, request):
    if userid in USERS:
        return GROUPS.get(userid, [])
