import { ApplyOptions } from "@sapphire/decorators";
import { PaginatedMessage } from "@sapphire/discord.js-utilities";
import { Command, CommandOptions } from "@sapphire/framework";
import type { Message } from "discord.js";
import { MessageEmbed } from "discord.js";

@ApplyOptions<CommandOptions>({
  aliases: ["pm"],
  description: "A command that uses paginated messages.",
  generateDashLessAliases: true,
  preconditions: ["OwnerOnly"],
})
export class UserCommand extends Command {
  public async run(message: Message) {
    const paginatedMessage = new PaginatedMessage({
      template: new MessageEmbed()
        .setColor("#FF0000")
        // Be sure to add a space so this is offset from the page numbers!
        .setFooter(" footer after page numbers"),
    });

    paginatedMessage
      .addPageEmbed((embed) =>
        embed //
          .setDescription("This is the first page")
          .setTitle("Page 1")
      )
      .addPageBuilder((builder) =>
        builder //
          .setContent("This is the second page")
          .setEmbeds([new MessageEmbed().setTimestamp()])
      );

    await paginatedMessage.run(message, message.author);
    return message;
  }
}
