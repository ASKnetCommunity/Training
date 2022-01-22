'''
Converts ASKotec training module meta-data
(from module.yaml) into an RDF/Turtle.
'''

import glob
import os
from rdflib.namespace import DC, DCTERMS, DOAP, FOAF, SKOS, OWL, RDF, RDFS, VOID, XMLNS, XSD
import wget
from yaml2rdf_shared import *

def convert_module_yaml_to_rdf(yaml_cont, g):
    '''
    Converts ASKotec training module meta-data content
    into an RDF/Turtle string.
    '''

    supported_version = "1.0"
    if version_compare(yaml_cont['version'], supported_version) < 0:
        raise 'The content version is not supported by this converter. Please get a newer version!'

    y = yaml_cont['module']
    pre_path = 'module'

    m_s = ASKM[str2id(y['name'])]

    ensure_resource_turtles(y, g)
    for res_ttl in glob.glob('resource_*.ttl'):
        g.parse(res_ttl, format='ttl')
    for res_s,_,_ in g.triples((None, RDF['type'], ASK['Resource'])):
        g.add(( m_s, ASK.resource, res_s ))

    g.add(( m_s, RDF.type, ASK.Module ))
    g.add(( m_s, RDFS.label, rdf_str(y['name']) ))
    if 'manual' in y:
        g.add(( m_s, ASK.manual, rdf_path(y['manual']) ))
    elif os.path.exists('manual.md'):
        g.add(( m_s, ASK.manual, rdf_path('manual.md') ))
    else:
        conv_fail('Entry not found "%s", and default path "%s" does not exist'
                % (pre_path + '.' + 'manual', os.path.curdir + '/manual.md'))
    g.add(( m_s, ASK.release, rdf_str(y['release']) ))
    g.add(( m_s, SCHEMA.duration, rdf_duration(y['duration']) ))
    g.add(( m_s, ASK.maxParticipants, rdf_int(int(y['max-participants'])) ))
    g.add(( m_s, ASK.compatibility, rdf_str(y['compatibility']) ))
    if 'blog' in y:
        g.add(( m_s, ASK.blog, rdf_url(y['blog']) ))
    if 'issues' in y:
        g.add(( m_s, ASK.issues, rdf_url(y['issues']) ))
    if 'new-issue' in y:
        g.add(( m_s, ASK.newIssue, rdf_url(y['new-issue']) ))

    conv_authors(y, g, m_s)
    conv_licenses(y, g, m_s)
