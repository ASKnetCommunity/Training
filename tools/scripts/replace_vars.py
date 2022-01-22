import abc
import re
import sys
from string import Template
import click

CONTEXT_SETTINGS = dict(help_option_names=['-h', '--help'])

class TextFilter(metaclass=abc.ABCMeta):
    ''' Abstract class; to be overridden. '''
    @abc.abstractmethod
    @abc.abstractmethod
    def describe_intent(self) -> None:
        ''' Mock function stub; to be overridden. '''
        raise NotImplementedError('users must define "describe_intent" to use this base class')
    @abc.abstractmethod
    def filter(self, text) -> str:
        ''' Mock function stub; to be overridden. '''
        raise NotImplementedError('users must define "filter" to use this base class')

class RegexTextFilter(TextFilter):
    ''' Allows to filter a text by a regex search and replace. '''
    def __init__(self, search_p, repl_p):
        self.search = re.compile(search_p)
        self.repl = repl_p
    def describe_intent(self):
        return "INFO: replacing (regex): '%s' -> '%s'" % (self.search.pattern, self.repl)
    def filter(self, text):
        return self.search.sub(self.repl, text)

class TemplateFilter(TextFilter):
    '''
        Allows to filter a text with a template;
        see the string.Template class.
    '''
    def __init__(self, template_class, replacements):
        self.template_class = template_class
        self.replacements = replacements
    def describe_intent(self):
        lines = []
        for key, value in self.replacements.items():
            lines.append("INFO: replacing (static): '${%s}' -> '%s'" % (key, value)) # FIXME This is not generic yet, but fixed to our own filter: TemplatePedanticBash
        return '\n'.join(lines)
    def filter(self, text):
        template = self.template_class(text)
        return template.safe_substitute(self.replacements)


class TemplatePedanticBash(Template):
    '''
        Replaces only braced identifiers like "${key}" (not "$key").
        Use "$" in front to escpape, like "$${key}".
    '''
    delimiter = '$'
    pattern = r'''
    \$(?:
      (?P<escaped>\$)                 | # Escape sequence of two delimiters
      \b\B(?P<named>[_a-z][_a-z0-9]*) | # Disable un-braced name matching
      {(?P<braced>[_a-z][_a-z0-9]*)}  | # delimiter and a braced identifier
      (?P<invalid>)                     # Other ill-formed delimiter exprs
    )
    '''

class KeyValuePairType(click.ParamType):
    '''
        Allows to parse strings into key+value pairs,
        separated by either ':' or '='.
        This is for the click command-line parsing lib.
    '''
    name = 'key-value-pair'
    sep = None

    def __init__(self, sep=None):
        self.sep = sep
        if not self.sep:
            self.sep = '[:=]'

    def convert(self, value, param, ctx) -> [str, str]:
        try:
            key_value = re.split(self.sep, value, 1)
            if len(key_value) < 2:
                raise ValueError("No key-value separator (regex: '%s') found!" % self.sep)
            return key_value
        except ValueError as err:
            self.fail(('"%s" is not a valid %s. ' +
                    'It needs to be of the form "key<separator>value".;\n' +
                    'Error: %s')
                    % (value, self.name, err), param, ctx)

KEY_VALLUE_PAIR = KeyValuePairType()

@click.group(context_settings=CONTEXT_SETTINGS)
@click.version_option()
def replace_vars() -> None:
    pass

def replace_vars_by_lines(in_file, out_file, replacements, dry=False,
        verbose=False, pre_filter=None, post_filter=None) -> None:
    with open(in_file, "r") as src:
        with open(out_file, "w") as dst:
            replace_vars_by_lines_in_stream(src, dst, replacements, dry,
                    verbose, pre_filter, post_filter)

def replace_vars_by_lines_in_stream(fp_in, fp_out, replacements, dry=False,
        verbose=False, pre_filter=None, post_filter=None) -> None:
    if not replacements:
        print('WARNING: No replacements supplied!', file=sys.stderr)
    filters = []
    if pre_filter:
        filters.append(pre_filter)
    filters.append(TemplateFilter(TemplatePedanticBash, replacements))
    if post_filter:
        filters.append(post_filter)
    filter_stream(fp_in, fp_out, filters, dry, verbose)

def filter_stream(fp_in, fp_out, filters=[], dry=False, verbose=False) -> None:
    if not filters:
        print('WARNING: No filters supplied!', file=sys.stderr)
    if verbose:
        for fltr in filters:
            print(fltr.describe_intent(), file=sys.stderr)
    if not dry:
        for line in fp_in:
            for fltr in filters:
                line = fltr.filter(line)
            fp_out.write(line)

@click.command(context_settings=CONTEXT_SETTINGS)
@click.argument("src", type=click.File("r"))
@click.argument("dst", type=click.File("w"))
@click.argument("replacements", type=KEY_VALLUE_PAIR, nargs=-1)
@click.option('--dry', is_flag=True, help='Whether to skip the actual replacing')
@click.option('--verbose', is_flag=True, help='Whether to output additional info to stderr')
def cli(src, dst, replacements, dry=False, verbose=False) -> None:
    '''
    This script works similar to the Unix `cat` command but it writes
    into a specific file (which could be the standard output as denoted by
    the ``-`` sign).
    \b
    Copy stdin to stdout:
        replace_vars - -
    \b
    Copy foo.txt and bar.txt to stdout:
        replace_vars foo.txt bar.txt -
    \b
    Write stdin into the file foo.txt
        replace_vars - foo.txt
    '''
    replacements_dict = {}
    for key, value in replacements:
        replacements_dict[key] = value
    replace_vars_by_lines_in_stream(src, dst, replacements_dict, dry, verbose)

if __name__ == '__main__':
    cli()
