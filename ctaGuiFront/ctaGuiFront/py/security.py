USERS = {'editor':'editor',
          'viewer':'viewer'}
GROUPS = {'editor':['group:editors']}

def groupfinder(userid, request):
    if userid in USERS:
        print '=========================',userid,GROUPS.get(userid, [])
        return GROUPS.get(userid, [])
